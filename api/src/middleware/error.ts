import log from "@/log";

export const errorHandler = (err, req, res, next) => {
  const error = {
    error: {
      message: err.message,
      name: err.name,
      statusCode: err.statusCode,
    },
  };
  log.error(error);
  res.status(err.statusCode || 500).json(error);
};
