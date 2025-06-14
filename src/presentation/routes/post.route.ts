import { Router } from "express";
import { CloudinaryAdapter } from "../../application/adapters/CloudinaryAdapter";
import { AuthMiddleware } from "../../infrastructure/middlewares/authenticated";
import { S3Adapter } from "../../application/adapters/s3.adapter";
import { s3ConfigGirls } from "../../core/config/s3.config";
import { PostRepository } from "../../infrastructure/database/repositories/post.repository";
import { PostService } from "../../application/services/post.service";
import { PostController } from "../controllers/post.controlle";
import { UserRepository } from "../../infrastructure/database/repositories/user.repository";
import { GirlRepository } from "../../infrastructure/database/repositories/girl.repository";

const postRepository = new PostRepository();
const userReoisitory = new UserRepository();
const girlRepository = new GirlRepository();
const authenticatedMiddleware = new AuthMiddleware(userReoisitory);
const s3Adapter = new S3Adapter(s3ConfigGirls);
const postService = new PostService(postRepository, girlRepository, s3Adapter);
const postController = new PostController(postService);

const router = Router();

router.post(
  "/",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  postController.createPost.bind(postController)
);

router.get("/", postController.getAllPost.bind(postController));
router.get('/:slug', postController.getPostBySlug.bind(postController));

router.put('/:id',
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  postController.updatePost.bind(postController)
);

router.put('/:id/delete-content',
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  postController.deleteContent.bind(postController)
)

export default router;
