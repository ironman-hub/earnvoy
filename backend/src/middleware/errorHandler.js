function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Invalid input.", details: err.errors });
  }

  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong on our end."
      : err.message || "Something went wrong.";

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
