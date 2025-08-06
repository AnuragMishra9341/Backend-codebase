const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next))
      .catch((err) => {
        next(err);
      });
  };
};




// const asyncHandler = (fn) => {
//   return async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       res.status(error.statuscode || 500).json({
//         success: false,
//         message: error.message,
//          OR next(error);
//       });
//     }
//   };
// };


export default asyncHandler;