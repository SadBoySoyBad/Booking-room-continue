const fail = (status, message) => Object.assign(new Error(message), { status });
const publicUser = (user) => {
  if (!user) return null;
  const { password, google_access_token, google_refresh_token, microsoft_access_token,
    microsoft_refresh_token, ...safe } = user;
  return safe;
};
const errorResponse = (res, error) => {
  const status = error.status || (error.code === 11000 ? 409 :
    ['CastError', 'ValidationError'].includes(error.name) ? 400 : 500);
  return res.status(status).json({ message: status === 500 ? 'Internal Server Error' :
    error.code === 11000 ? 'This value is already in use.' : error.message });
};
module.exports = { fail, publicUser, errorResponse };
