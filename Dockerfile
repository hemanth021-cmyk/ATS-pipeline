# Build SPA, then run API + serve ../frontend/dist (see backend/src/app.js)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
# Same-origin API when UI is served from this container (empty → `/api` in the SPA)
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN cd frontend && npm run build

FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY backend ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV NODE_ENV=production
ENV SERVE_STATIC=true
# -------------------------------------------------
# Add entrypoint script for pre‑start migrations
# -------------------------------------------------
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/index.js"]
