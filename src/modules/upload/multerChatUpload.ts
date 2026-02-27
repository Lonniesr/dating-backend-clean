import multer from "multer";

const storage = multer.memoryStorage();

const chatUpload = multer({ storage });

export default chatUpload;