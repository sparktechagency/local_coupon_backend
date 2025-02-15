import * as userRouter from "@routes/app";

const registerUserRoutes = (app: any) => {
  app.use("/auth", userRouter.authRoutes);
  app.use("/profile", userRouter.profileRoutes);
};

export { registerUserRoutes };
