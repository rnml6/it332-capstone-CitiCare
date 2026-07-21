import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { bhwApi } from '../api/bhwApi';
import { purokApi } from '../api/purokApi';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import LoadingSpinner from '../components/LoadingSpinner';

const BHWForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [puroks, setPuroks] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const positionDropdownRef = useRef(null);
  const positionInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    contactNumber: '',
    email: '',
    status: 'Active',
    assignedPurokId: '',
    username: '',
    password: '',
    confirmPassword: '',
    accountRole: 'BHW Worker',
  });

  const [errors, setErrors] = useState({});

  const positionPresets = [
    { label: 'Barangay Health Worker', type: 'BHW', accountRole: 'BHW Worker' },
    { label: 'Barangay Health Worker Head', type: 'BHW', accountRole: 'BHW Admin' },
    { label: 'Nurse', type: 'Nurse', accountRole: null },
    { label: 'Midwife', type: 'Midwife', accountRole: null },
    { label: 'Doctor', type: 'Doctor', accountRole: null },
  ];

  // Use direct check instead of debounced for layout stability
  const isBHW = formData.position === 'Barangay Health Worker' || formData.position === 'Barangay Health Worker Head';
  const isBHWWorker = formData.position === 'Barangay Health Worker';
  const isBHWHead = formData.position === 'Barangay Health Worker Head';

  const filteredPositions = formData.position
    ? positionPresets.filter(p => p.label.toLowerCase().includes(formData.position.toLowerCase()))
    : positionPresets;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(e.target) &&
          positionInputRef.current && !positionInputRef.current.contains(e.target)) {
        setShowPositionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isBHW) fetchPuroks();
    if (isEditing) fetchBHW();
  }, [id]);

  const fetchPuroks = async () => {
    try {
      const response = await purokApi.getAll();
      if (response.data.success) setPuroks(response.data.data);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchBHW = async () => {
    try {
      const response = await bhwApi.getById(id);
      if (response.data.success) {
        const d = response.data.data;
        if (d.workerType === 'BHW') fetchPuroks();
        setFormData({
          name: d.name || '',
          position: d.position || '',
          contactNumber: d.contactNumber || '',
          email: d.email || '',
          status: d.status || 'Active',
          assignedPurokId: d.assignedPurokId || '',
          username: d.username || '',
          password: '',
          confirmPassword: '',
          accountRole: d.position === 'Barangay Health Worker Head' ? 'BHW Admin' : 'BHW Worker',
        });
      }
    } catch (error) { console.error('Error:', error); } 
    finally { setFetching(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-set account role when position changes by typing
      if (name === 'position') {
        const preset = positionPresets.find(p => p.label.toLowerCase() === value.toLowerCase());
        if (preset?.accountRole) {
          updated.accountRole = preset.accountRole;
        }
        // Clear fields when switching away from BHW Worker
        if (value !== 'Barangay Health Worker') {
          updated.assignedPurokId = '';
        }
        // Clear credentials when switching away from BHW entirely
        if (value !== 'Barangay Health Worker' && value !== 'Barangay Health Worker Head') {
          updated.username = '';
          updated.password = '';
          updated.confirmPassword = '';
        }
      }
      
      return updated;
    });
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePositionSelect = (position) => {
    const preset = positionPresets.find(p => p.label === position);
    
    setFormData(prev => {
      const updated = { ...prev, position };
      
      if (preset?.accountRole) {
        updated.accountRole = preset.accountRole;
      }
      
      // Only BHW Worker gets assigned purok
      if (position !== 'Barangay Health Worker') {
        updated.assignedPurokId = '';
      }
      
      // Only BHW types get credentials
      if (position !== 'Barangay Health Worker' && position !== 'Barangay Health Worker Head') {
        updated.username = '';
        updated.password = '';
        updated.confirmPassword = '';
      }
      return updated;
    });
    setShowPositionDropdown(false);
  };

  const handlePositionInputChange = (e) => {
    setFormData(prev => ({ ...prev, position: e.target.value }));
    setShowPositionDropdown(true);
  };

  const getWorkerType = (position) => {
    const preset = positionPresets.find(p => p.label === position);
    return preset?.type || 'Other';
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.position) newErrors.position = 'Position is required';
    
    if (isBHW) {
      if (formData.username || formData.password || formData.confirmPassword) {
        if (!formData.username) newErrors.username = 'Username is required';
        else if (formData.username.length < 3) newErrors.username = 'Min 3 characters';
        if (!isEditing && !formData.password) newErrors.password = 'Password is required';
        else if (formData.password && formData.password.length < 6) newErrors.password = 'Min 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const workerType = getWorkerType(formData.position);
      
      const dataToSend = {
        name: formData.name,
        position: formData.position,
        contactNumber: formData.contactNumber,
        email: formData.email,
        status: formData.status,
        workerType: workerType,
        accountRole: formData.accountRole,
        assignedPurokId: isBHWWorker ? (formData.assignedPurokId || null) : null,
      };

      if (isBHW) {
        if (formData.username || formData.password) {
          dataToSend.username = formData.username;
          if (formData.password) dataToSend.password = formData.password;
        }
      }

      if (isEditing) {
        await bhwApi.update(id, dataToSend);
      } else {
        await bhwApi.create(dataToSend);
      }
      navigate('/bhw');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  if (fetching) return <LoadingSpinner message="Loading..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/bhw')} className="flex items-center space-x-2 text-white/50 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" /><span>Back</span>
      </button>
      <h1 className="text-xl font-bold text-white">{isEditing ? 'Edit' : 'Add'} Healthcare Professional</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Professional Information */}
        <GlassCard hover={false}>
          <h3 className="text-base font-medium text-white/80 mb-3">Professional Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="glass-input text-sm" placeholder="Full name" required />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div className="relative" ref={positionDropdownRef}>
                <label className="block text-xs text-white/40 mb-1">Position *</label>
                <div className="relative">
                  <input
                    ref={positionInputRef}
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handlePositionInputChange}
                    onFocus={() => setShowPositionDropdown(true)}
                    className="glass-input pr-8 text-sm"
                    placeholder="Search or type position..."
                    required
                  />
                  <ChevronDown 
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-transform cursor-pointer ${showPositionDropdown ? 'rotate-180' : ''}`}
                    onClick={() => setShowPositionDropdown(!showPositionDropdown)}
                  />
                </div>
                {errors.position && <p className="text-xs text-red-400 mt-1">{errors.position}</p>}
                
                {showPositionDropdown && filteredPositions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-[#0f1535] border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                    {filteredPositions.map((pos) => (
                      <button
                        key={pos.label}
                        type="button"
                        onClick={() => handlePositionSelect(pos.label)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                          formData.position === pos.label ? 'text-blue-300 bg-blue-500/10' : 'text-white/70'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Contact Number</label>
                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="glass-input text-sm" placeholder="Phone" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="glass-input text-sm" placeholder="Email" />
              </div>
              
              {/* Status and Assigned Purok */}
              {isBHWWorker ? (
                <>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="glass-select text-sm">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Assigned Purok</label>
                    <select name="assignedPurokId" value={formData.assignedPurokId} onChange={handleChange} className="glass-select text-sm">
                      <option value="">None</option>
                      {puroks.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="block text-xs text-white/40 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="glass-select text-sm">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Login Credentials - Only for BHW */}
        {isBHW && (
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-white/80">Login Credentials</h3>
              <span className="text-xs text-white/40">
                {isEditing && formData.username ? 'Leave password blank to keep current' : 'Optional'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="glass-input text-sm" placeholder="Login username" />
                {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Account Role</label>
                <select name="accountRole" value={formData.accountRole} onChange={handleChange} className="glass-select text-sm">
                  <option value="BHW Worker">BHW Worker</option>
                  <option value="BHW Admin">BHW Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">{isEditing ? 'New Password' : 'Password'}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                    className="glass-input pr-10 text-sm" placeholder={isEditing ? 'Leave blank to keep' : 'Password'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                <button type="button" onClick={generatePassword} className="text-xs text-blue-400 hover:text-blue-300 mt-1">Generate password</button>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  className="glass-input text-sm" placeholder="Confirm password" />
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
            {isEditing && formData.username && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                <p className="text-xs text-blue-300">Login: <strong>{formData.username}</strong></p>
              </div>
            )}
          </GlassCard>
        )}

        {/* Non-BHW notice */}
        {!isBHW && formData.position && (
          <GlassCard hover={false}>
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <p className="text-sm text-white/50">
                This professional type does not require login credentials and is not assigned to specific puroks.
                They can be assigned to schedules and programs.
              </p>
            </div>
          </GlassCard>
        )}

        <div className="flex justify-end gap-3">
          <GlassButton variant="secondary" type="button" onClick={() => navigate('/bhw')}>Cancel</GlassButton>
          <GlassButton type="submit" loading={loading}>
            {isEditing ? 'Update' : 'Add'} Professional
          </GlassButton>
        </div>
      </form>
    </div>
  );
};

export default BHWForm;