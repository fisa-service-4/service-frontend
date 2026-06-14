
export const getApiStatusColor = (status: string): string => {
  switch (status) {
    case 'online':  return 'bg-sky-50 border-sky-200';
    case 'slow':    return 'bg-amber-50 border-amber-200';
    case 'offline': return 'bg-red-50 border-red-200';
    default:        return 'bg-gray-50 border-gray-200';
  }
};
