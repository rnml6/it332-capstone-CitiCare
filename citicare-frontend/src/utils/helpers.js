export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (time) => {
  if (!time) return 'N/A';
  return time;
};

export const getRiskColor = (risk) => {
  switch (risk) {
    case 'Critical Health Risk': return 'badge-critical';
    case 'High Health Risk': return 'badge-high';
    case 'Moderate Health Risk': return 'badge-moderate';
    case 'Low Health Risk': return 'badge-low';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'badge-completed';
    case 'Scheduled': return 'badge-scheduled';
    case 'Missed': return 'badge-missed';
    case 'Active': return 'badge-active';
    case 'Inactive': return 'badge-inactive';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};