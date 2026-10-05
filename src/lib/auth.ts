// Sistema de usuarios con localStorage
export const getUsersFromStorage = () => {
  try {
    const users = localStorage.getItem('santandereano_users');
    const defaultUsers = getDefaultUsersOnly();
    
    if (users) {
      const parsedUsers = JSON.parse(users);
      const mergedUsers = { ...defaultUsers, ...parsedUsers };
      localStorage.setItem('santandereano_users', JSON.stringify(mergedUsers));
      return mergedUsers;
    }
    
    localStorage.setItem('santandereano_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    return getDefaultUsers();
  }
};

export const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem('santandereano_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error guardando usuarios:', error);
  }
};

export const getDefaultUsersOnly = () => {
  const salt1 = 'admin_salt';
  const salt2 = 'cajero_salt';
  const salt3 = 'mesero1_salt';
  const salt4 = 'mesero2_salt';
  return {
    'admin@santandereano.com': {
      email: 'admin@santandereano.com',
      password: simpleHash('hello', salt1),
      role: 'dueño',
      name: 'Administrador',
      salt: salt1,
      active: true,
      createdAt: new Date().toISOString()
    },
    'administrivocaja@santandereano.com': {
      email: 'administrivocaja@santandereano.com',
      password: simpleHash('1010230caja', salt2),
      role: 'cajera',
      name: 'Cajero Principal',
      salt: salt2,
      active: true,
      createdAt: new Date().toISOString()
    },
    'yesidcastro703@gmail.com': {
      email: 'yesidcastro703@gmail.com',
      password: simpleHash('1007918051', salt3),
      role: 'mesero',
      name: 'Yesid Castro',
      salt: salt3,
      active: true,
      createdAt: new Date().toISOString()
    },
    'jonathancastro@santandereano.com': {
      email: 'jonathancastro@santandereano.com',
      password: simpleHash('jonatican', salt4),
      role: 'mesero',
      name: 'Jonathan Castro',
      salt: salt4,
      active: true,
      createdAt: new Date().toISOString()
    }
  };
};

export const getDefaultUsers = () => {
  const defaultUsers = getDefaultUsersOnly();
  localStorage.setItem('santandereano_users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

// Función simple de hash (SHA-256 simulado)
export const simpleHash = (password, salt) => {
  const combined = password + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64);
};

// Generar salt aleatorio
export const generateSalt = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Crear nuevo usuario (solo meseros por defecto)
export const createUser = (email, password, name) => {
  const users = getUsersFromStorage();
  const normalizedEmail = email.toLowerCase().trim();
  
  if (users[normalizedEmail]) {
    throw new Error('El email ya está registrado');
  }
  
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Email inválido');
  }
  
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  const salt = generateSalt();
  const hashedPassword = simpleHash(password, salt);
  
  users[normalizedEmail] = {
    email: normalizedEmail,
    password: hashedPassword,
    name,
    role: 'mesero',
    salt,
    active: true,
    createdAt: new Date().toISOString()
  };
  
  saveUsersToStorage(users);
  return users[normalizedEmail];
};

// Función para verificar contraseña
export const verifyPassword = (inputPassword, storedHash, salt) => {
  const inputHash = simpleHash(inputPassword, salt);
  return inputHash === storedHash;
};
