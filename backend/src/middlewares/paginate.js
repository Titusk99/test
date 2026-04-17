// Middleware de pagination — injecte page/limit dans req et ajoute paginateQuery helper
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  req.pagination = { page, limit, skip };

  // Helper pour construire la réponse paginée
  req.paginate = (total, data) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  });

  next();
};

module.exports = paginate;
