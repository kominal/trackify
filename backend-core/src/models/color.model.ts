import { ApiProperty } from '@nestjs/swagger';

// Palette keys, mapped to fixed colours (light and dark) by the frontend. Stored as keys instead of
// hex values or CSS class names so the palette can change without migrating data.
export enum Color {
  BLUE = 'BLUE',
  ORANGE = 'ORANGE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  PINK = 'PINK',
  TEAL = 'TEAL',
  PURPLE = 'PURPLE',
  RED = 'RED',
  GRAY = 'GRAY',
}
export const ColorDecorator = ApiProperty({ enum: Color, enumName: 'Color' });
