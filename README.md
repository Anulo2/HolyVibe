# HolyVibe - Church Management Application

A comprehensive church/parish events management platform built with React and ElysiaJS using Bun. This application enables parishes to manage families, children, events, and authorized persons for child pickup/supervision with a focus on safety and organization.

## 💻 Client

Uses the following tech stack.

- Web Framework: [React](https://react.dev)
- State Management: [Zustand](https://github.com/pmndrs/zustand)
- Styling: [TailwindCSS](https://tailwindcss.com)
- Icons: [Lucide Icons](https://lucide.dev)
- Toasts: [Sonner](https://sonner.emilkowal.ski/)
- Tooling: [Vite](https://vitejs.dev), [Bun](https://bun.sh)


## 🌐 Server

Uses the following tech stack.

- Runtime: [Bun](https://bun.sh)
- Server Framework: [Elysia](https://elysiajs.com)
- DB: [SQlite](https://sqlite.org) (libsql client)
- ORM: [Drizzle](https://orm.drizzle.team)
- Validation: [Typebox](https://github.com/sinclairzx81/typebox)

## 🪄 Other Goodies

- Formatting: [BiomeJS](https://biomejs.dev)
- Linting: [BiomeJS](https://biomejs.dev)
- Build System: [Turbo](https://turbo.build)
- Monorepo Management: [Bun Workspaces](https://bun.sh/docs/install/workspaces)
- Authentication: [Better Auth](https://better-auth.com)
- RPC Communication: [ORPC](https://orpc.dev)
- UI Components: [shadcn/ui](https://ui.shadcn.com)

## 🚀 Usage

### 📦 Installing Dependencies

Run this command from the root directory.

```sh
bun install
```

### 🟣 Starting Backend

To start elysia server, run this command from the **./server** directory.

```sh
bun run dev
```

If this is your first time running the server, you'll need to generate the db file with this command.

```sh
bun run db:push
```

### 🔵 Starting Frontend

To start vite dev server, run this command from the **./client** directory.

```sh
bun run dev
```

Yes, run both at the same time, its that simple !!!

## 🍀 Show your Support

Give a ⭐️ if this project helped you!
