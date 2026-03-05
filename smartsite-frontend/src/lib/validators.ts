export type ValidationError = string | null;

export const validators = {
  // Username validation
  username: (value: string): ValidationError => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    return null;
  },

  // Email validation
  email: (value: string): ValidationError => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email must be valid';
    return null;
  },

  // Password validation
  password: (value: string): ValidationError => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letters';
    if (!/\d/.test(value)) return 'Password must contain numbers';
    if (!/[@$!%*?&]/.test(value)) return 'Password must contain special characters (@$!%*?&)';
    return null;
  },

  // First name validation
  firstName: (value: string): ValidationError => {
    if (!value) return 'First name is required';
    if (value.length < 2) return 'First name must be at least 2 characters';
    if (value.length > 50) return 'First name cannot exceed 50 characters';
    return null;
  },

  // Last name validation
  lastName: (value: string): ValidationError => {
    if (!value) return 'Last name is required';
    if (value.length < 2) return 'Last name must be at least 2 characters';
    if (value.length > 50) return 'Last name cannot exceed 50 characters';
    return null;
  },

  // Role validation
  role: (value: string): ValidationError => {
    if (!value) return 'Role is required';
    const validRoles = ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT'];
    if (!validRoles.includes(value)) {
      return `Role must be one of: ${validRoles.join(', ')}`;
    }
    return null;
  },

  // Company name validation
  companyName: (value: string): ValidationError => {
    const trimmed = value.trim();
    if (!trimmed) return 'Company name is required';
    if (trimmed.length < 2) return 'Company name must be at least 2 characters';
    if (trimmed.length > 255) return 'Company name cannot exceed 255 characters';
    return null;
  },

  // Company description validation
  companyDescription: (value: string): ValidationError => {
    if (value.trim().length > 2000) return 'Description cannot exceed 2000 characters';
    return null;
  },

  // Company contact name validation
  companyContactName: (value: string): ValidationError => {
    if (value.trim().length > 255) return 'Contact name cannot exceed 255 characters';
    return null;
  },

  // Company contact email validation
  companyContactEmail: (value: string): ValidationError => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > 255) return 'Contact email cannot exceed 255 characters';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Contact email must be valid';
    return null;
  },

  // Company manager validation
  companyManagerUserId: (value: string, required = true): ValidationError => {
    const trimmed = value.trim();
    if (required && !trimmed) return 'Company manager is required';
    if (!trimmed) return null;
    if (!/^[a-f\d]{24}$/i.test(trimmed)) return 'Manager ID format is invalid';
    return null;
  },
};
