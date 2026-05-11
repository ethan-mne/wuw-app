FROM node:18-alpine AS base

# Prisma on Alpine: OpenSSL + glibc compat for native engines
RUN apk add --no-cache libc6-compat openssl

# Pin pnpm 9.x (matches lockfile v9). Avoid Corepack + pnpm 11 on Node 18 (ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING).
RUN npm install -g pnpm@9.15.9

FROM base AS deps
WORKDIR /app

# Copy package files + Prisma schema (postinstall runs prisma generate)
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

ENV SKIP_ENV_VALIDATION=1

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Matches builder: full schema is web+payments; slim API stacks omit OAuth/PayPal/Posthog.
# Omit or set SKIP_ENV_VALIDATION=0 plus all secrets when running the complete app in Docker.
ENV SKIP_ENV_VALIDATION=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
