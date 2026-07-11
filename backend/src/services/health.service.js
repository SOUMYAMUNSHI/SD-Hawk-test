export const checkHealth = () => {
  return {
    status: 'success',
    message: 'API is running smoothly',
    timestamp: new Date().toISOString(),
  };
};
