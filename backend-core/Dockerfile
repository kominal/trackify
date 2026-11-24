FROM node:24
WORKDIR /usr/src/app/
ENV NODE_ENV production
COPY package.json /usr/src/app/
COPY node_modules /usr/src/app/node_modules
COPY dist/ /usr/src/app/
# Healthy = the process answers at all. A database outage answers 503 and must not restart the
# container (that would not bring the database back); the status page watches /health for that.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --start-interval=5s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health', { signal: AbortSignal.timeout(4000) }).then(() => process.exit(0), () => process.exit(1))"]
CMD ["node", "--unhandled-rejections=strict", "main.js"]
