import authorize from "@middleware/auth";
import * as userRouter from "@routes/app";

const registerUserRoutes = (app: any) => {
  app.use("/auth", userRouter.authRoutes);
  app.use("/profile", authorize(["user"]), userRouter.profileRoutes);
};

export { registerUserRoutes };
