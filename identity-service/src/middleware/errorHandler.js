

const errorHandler = (err, req, res, next) => {
  console.log(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
};

export default errorHandler;