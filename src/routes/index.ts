import authorize from "@middleware/auth";
import * as userRouter from "@routes/app";
import * as adminRouter from "@routes/admin";
import webhookRoutes from "@routes/webhook.routes";

const userRoutes = [
  {
    path: "/auth",
    router: userRouter.authRoutes,
  },
  {
    path: "/profile",
    router: userRouter.profileRoutes,
    middleware: authorize(["user", "business"]),
  },
  {
    path: "/stripe",
    router: userRouter.stripeRoutes,
    middleware: authorize(["user"]),
  },
  {
    path: "/legal",
    router: userRouter.legalRoutes,
    middleware: authorize(["user"]),
  },
  {
    path: "/contact-us",
    router: userRouter.contactUsRoutes,
    middleware: authorize(["user", "business"]),
  },
  {
    path: "/coupons",
    router: userRouter.couponsRoutes,
    // auth middlewares for this route is in the coupons.routes.ts file,
  },
  {
    path: "/categories",
    router: userRouter.categoriesRoutes,
    middleware: authorize(["user", "business"]),
  },
];

const adminRoutes = [
  {
    path: "/subscriptions",
    router: adminRouter.subscriptionsRoutes,
  },
  {
    path: "/legal",
    router: adminRouter.legalRoutes,
  },
  {
    path: "/categories",
    router: adminRouter.categoriesRoutes,
  },
];

const registerUserRoutes = (app: any) => {
  userRoutes.forEach((route) => {
    if (route.middleware) {
      app.use(route.path, route.middleware, route.router);
    } else {
      app.use(route.path, route.router);
    }
  });
};

const registerAdminRoutes = (app: any) => {
  adminRoutes.forEach((route) => {
    app.use(`/admin${route.path}`, authorize(["admin"]), route.router);
  });
};

const registerRoutesThatNeedsRawBody = (app: any) => {
  app.use("/stripe", webhookRoutes);
};

export {
  registerUserRoutes,
  registerAdminRoutes,
  registerRoutesThatNeedsRawBody,
};
