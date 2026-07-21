const StatCard = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-emerald-400 to-emerald-600',
    purple: 'from-purple-400 to-purple-600',
    red: 'from-red-400 to-red-600',
    orange: 'from-orange-400 to-orange-600',
  };

  return (
    <div className="stat-card animate-slide-up">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white/60">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;