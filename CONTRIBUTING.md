# Contributing

¡Gracias por tu interés en mejorar el Meta Ads Dashboard! Las contribuciones son bienvenidas.

## Cómo contribuir

### Reportar un bug

1. Revisa los [issues existentes](https://github.com/soyalvaropareja/dashboard-meta-ads/issues) para ver si ya ha sido reportado.
2. Si no existe, abre un nuevo issue describiendo:
   - Qué estabas intentando hacer
   - Qué esperabas que pasara
   - Qué pasó en realidad
   - Pasos para reproducirlo
   - Versión de Node, sistema operativo y navegador

### Proponer una funcionalidad

Abre un issue con el prefijo `[Feature]` en el título y explica:
- El problema que resuelve
- Cómo te imaginas la solución
- Alternativas que hayas considerado

### Enviar un pull request

1. Haz fork del repositorio.
2. Crea una rama descriptiva: `git checkout -b feat/mi-nueva-funcionalidad` o `fix/descripcion-del-bug`.
3. Haz tus cambios siguiendo las convenciones del proyecto (ver más abajo).
4. Verifica que la app arranca sin errores: `cd dashboard && npm run dev`.
5. Asegúrate de que el build funciona: `npm run build`.
6. Haz commit con un mensaje claro (ver convenciones).
7. Abre el pull request con una descripción de los cambios.

## Convenciones

### Mensajes de commit

Usa el formato [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `refactor:` refactorización sin cambio funcional
- `style:` formato, espacios, comas (sin cambio de código)
- `chore:` tareas de mantenimiento (dependencias, configs)

Ejemplos:
```
feat: add period comparison selector to header
fix: handle empty insights array for new campaigns
docs: update setup instructions for Windows
```

### Estilo de código

- Usa **TypeScript estricto**.
- Sigue las convenciones existentes del proyecto (2 espacios de indentación, comillas simples, sin punto y coma).
- Los componentes React se nombran en `PascalCase`, los hooks en `camelCase` con prefijo `use`.
- Evita añadir dependencias nuevas salvo que sea necesario.

### Estructura de carpetas

- `dashboard/src/components/common/` — componentes reutilizables
- `dashboard/src/components/tabs/` — componentes de pestañas (campañas, ad sets, ads)
- `dashboard/src/components/detail/` — panel lateral de detalle
- `dashboard/src/hooks/` — custom hooks
- `dashboard/src/context/` — React contexts
- `dashboard/src/lib/` — lógica compartida (auditoría, utilidades)
- `dashboard/server/` — backend Express

## Código de conducta

Sé respetuoso y constructivo. Las críticas se dirigen al código, no a las personas.

## Licencia

Al contribuir aceptas que tu código se publica bajo la [licencia MIT](LICENSE) del proyecto.
