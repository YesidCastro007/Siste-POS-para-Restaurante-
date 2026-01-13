# 🍽️ Sistema de Restaurante Santandereano

Un sistema completo de gestión para restaurantes desarrollado con React, TypeScript y Vite. Diseñado específicamente para optimizar la operación del Restaurante Santandereano SAS.

## ✨ Características Principales

- 🔐 **Sistema de Autenticación Seguro** - Login con roles diferenciados y bloqueo por intentos fallidos
- 👥 **Gestión Multi-Rol** - Meseros, Cajeras y Administradores con permisos específicos
- 🏢 **Gestión de Mesas por Pisos** - Organización visual de 3 pisos con código de colores por mesero
- 📱 **Interfaz Responsiva** - Diseño adaptable para tablets y dispositivos móviles
- 🎨 **UI Moderna** - Interfaz elegante con gradientes y animaciones suaves
- 💾 **Persistencia Local** - Datos guardados en localStorage para funcionamiento offline

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Styling**: Tailwind CSS con gradientes personalizados
- **Storage**: localStorage para persistencia de datos

## 🎯 Funcionalidades por Rol

### 👨‍🍳 Meseros
- ✅ Gestión visual de mesas por pisos
- ✅ Sistema de pedidos dinámico con 5 categorías
- ✅ Configuración personalizada de picadas
- ✅ Selección rápida de productos con un clic
- ✅ Acumulación automática de cantidades
- ✅ Cálculo en tiempo real de totales

### 💰 Cajeras
- 🚧 Gestión de sabores de sopas (En desarrollo)
- 🚧 Procesamiento de pagos (En desarrollo)
- 🚧 Reportes de ventas (En desarrollo)

### 👔 Administradores
- 🚧 Panel de administración completo (En desarrollo)
- 🚧 Gestión de usuarios y permisos (En desarrollo)
- 🚧 Reportes y analytics (En desarrollo)

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/sistema-restaurante-santandereano.git

# Navegar al directorio
cd sistema-restaurante-santandereano

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Linting del código
```

## 🔑 Credenciales de Prueba

**Administrador:**
- Email: `admin@santandereano.com`
- Contraseña: `hello`

**Crear Mesero:**
- Usar el botón "Crear Nuevo Usuario" en la pantalla de login
- El email debe terminar en `@santandereano.com`

## 📱 Capturas de Pantalla

### Login Screen
- Diseño moderno con gradientes
- Validación en tiempo real
- Sistema de bloqueo por seguridad

### Dashboard de Meseros
- Vista de mesas por pisos
- Código de colores por mesero
- Interfaz intuitiva y rápida

### Modal de Pedidos
- 5 categorías visuales con iconos
- Configuración detallada de picadas
- Selección rápida con un clic
- Panel de pedido en tiempo real

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── ui/                 # Componentes base de shadcn/ui
│   └── SantandereanoSystem.tsx  # Componente principal
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y configuración
├── pages/                  # Páginas de la aplicación
└── main.tsx               # Punto de entrada
```

## 🎨 Diseño y UX

- **Paleta de Colores**: Gradientes rojos y dorados que reflejan la identidad del restaurante
- **Tipografía**: Fuentes modernas y legibles
- **Animaciones**: Transiciones suaves para mejor experiencia
- **Responsividad**: Adaptable a diferentes tamaños de pantalla

## 🔄 Estado del Desarrollo

### ✅ Completado
- [x] Sistema de autenticación
- [x] Dashboard de meseros
- [x] Gestión de mesas por pisos
- [x] Modal de pedidos completo
- [x] 5 categorías de productos
- [x] Acumulación de cantidades
- [x] Persistencia en localStorage

### 🚧 En Desarrollo
- [ ] Panel de cajeras completo
- [ ] Sistema de cobros
- [ ] Panel de administración
- [ ] Reportes y analytics
- [ ] Gestión de inventario
- [ ] Notificaciones en tiempo real

### 🎯 Próximas Funcionalidades
- [ ] Base de datos real (Firebase/Supabase)
- [ ] Sincronización en tiempo real
- [ ] App móvil con React Native
- [ ] Impresión de tickets
- [ ] Integración con sistemas de pago

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tu-perfil)

## 🙏 Agradecimientos

- shadcn/ui por los componentes base
- Lucide por los iconos
- Tailwind CSS por el sistema de estilos
- La comunidad de React por el ecosistema

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!