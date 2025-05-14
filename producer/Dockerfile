FROM denoland/deno:alpine

WORKDIR /app

COPY . .
RUN deno install

CMD deno task run
