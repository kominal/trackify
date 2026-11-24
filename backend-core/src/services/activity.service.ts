import { ActivityEntity, ActivityModel, ActivitySegment } from '@entities/activity.entity';
import { UserContext } from '@helpers/context.decorator';
import { RangeParams } from '@models/range.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// Consecutive segments of the same window with at most this gap are stored as one.
export const MERGE_GAP_MS = 30 * 1000;
const MAX_SEGMENT_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_MS = 62 * 24 * 60 * 60 * 1000;
// Clocks of PCs drift; segments from the future beyond this are refused.
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function sameWindow(a: Pick<ActivityEntity, 'app' | 'title' | 'idle'>, b: Pick<ActivityEntity, 'app' | 'title' | 'idle'>): boolean {
  return a.app === b.app && a.title === b.title && a.idle === b.idle;
}

@Injectable()
export class ActivityService {
  public constructor(@InjectModel(ActivityEntity.name) private readonly model: ActivityModel) {}

  public async upload(userContext: UserContext, segments: ActivitySegment[], now = new Date()): Promise<void> {
    const valid = segments
      .filter(({ start, end }) => end.getTime() > start.getTime() && end.getTime() - start.getTime() <= MAX_SEGMENT_MS && end.getTime() <= now.getTime() + MAX_CLOCK_SKEW_MS)
      .map((segment) => ({ ...segment, app: segment.app.trim().slice(0, 120) || '?', title: segment.title.trim().slice(0, 500) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Merge within the batch first, then with the user's latest stored segment.
    const merged: Omit<ActivityEntity, '_id' | 'userId'>[] = [];
    for (const segment of valid) {
      const last = merged[merged.length - 1];
      if (last && sameWindow(last, segment) && segment.start.getTime() - last.end.getTime() <= MERGE_GAP_MS) {
        last.end = new Date(Math.max(last.end.getTime(), segment.end.getTime()));
      } else {
        merged.push({ ...segment });
      }
    }
    if (merged.length === 0) {
      return;
    }

    const first = merged[0];
    const previous = await this.model.findOne({ userId: userContext.userId, start: { $lte: first.start } }).sort({ start: -1 });
    if (previous && sameWindow(previous, first) && first.start.getTime() - previous.end.getTime() <= MERGE_GAP_MS) {
      if (first.end.getTime() > previous.end.getTime()) {
        await previous.updateOne({ end: first.end });
      }
      merged.shift();
    }

    if (merged.length > 0) {
      await this.model.insertMany(merged.map((segment) => ({ ...segment, userId: userContext.userId })));
    }
  }

  public async list(userContext: UserContext, range: RangeParams): Promise<ActivityEntity[]> {
    this.assertRange(range);
    return this.model
      .find({ userId: userContext.userId, start: { $lt: range.to }, end: { $gt: range.from } })
      .sort({ start: 1 })
      .select({ _id: 0, userId: 0, __v: 0 })
      .lean<ActivityEntity[]>();
  }

  // Lets users remove what they do not want stored (a private hour, a whole day).
  public async delete(userContext: UserContext, range: RangeParams): Promise<void> {
    if (range.to.getTime() <= range.from.getTime()) {
      throw new HttpException('exception.invalidRange', 400);
    }
    // A segment reaching over both edges keeps its part after the range as a segment of its own.
    const spanning = await this.model.find({ userId: userContext.userId, start: { $lt: range.from }, end: { $gt: range.to } }).lean<ActivityEntity[]>();
    if (spanning.length > 0) {
      await this.model.insertMany(spanning.map(({ _id, ...segment }) => ({ ...segment, start: range.to })));
    }
    await this.model.deleteMany({ userId: userContext.userId, start: { $gte: range.from }, end: { $lte: range.to } });
    // Segments reaching over the edges are cut instead of removed.
    await this.model.updateMany({ userId: userContext.userId, start: { $lt: range.from }, end: { $gt: range.from } }, { end: range.from });
    await this.model.updateMany({ userId: userContext.userId, start: { $lt: range.to }, end: { $gt: range.to } }, { start: range.to });
  }

  public assertRange({ from, to }: RangeParams): void {
    if (to.getTime() <= from.getTime() || to.getTime() - from.getTime() > MAX_RANGE_MS) {
      throw new HttpException('exception.invalidRange', 400);
    }
  }
}
