// import { createNextApiHandler } from '@trpc/server/adapters/next';

// import { env } from '@/env';
// import { createTRPCContext } from '@/server/api/trpc';
// import { appRouter } from '@/server/api/root';

// // export API handler
// export default createNextApiHandler({
//   router: appRouter,
//   createContext: null,
//   onError:
//     env.NODE_ENV === 'development'
//       ? ({ path, error }) => {
//           console.error(
//             `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
//           );
//         }
//       : undefined,
// });
