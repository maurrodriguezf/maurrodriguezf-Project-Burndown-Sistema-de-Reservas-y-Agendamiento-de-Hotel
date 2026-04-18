Project Burndown: Sistema de Reservas y Agendamiento de Hotel
(Versión 2)
1. Introducción
El presente documento constituye el Project Burndown definitivo para el Sistema de
Reservas y Agendamiento de Hotel, desarrollado en el marco de la Experiencia 1:
Definiendo el ciclo y desarrollo del Software de la asignatura Ingeniería de Software
(PRY3211) . Como especialista en marcos adaptativos, este reporte representa la transición
desde una Especificación de Requisitos del Sistema (ERS) tradicional hacia un modelo ágil
basado en Scrum. El documento establece la visión inicial y la planificación iterativa
necesaria para abordar las necesidades del cliente bajo los estándares académicos de
Duoc UC, asegurando un ciclo de vida evolutivo y validado.
2. Problemática
A partir del análisis del Brief del caso , se identifica que Alberto , empresario hotelero,
enfrenta dificultades críticas en la gestión de su negocio de hospedaje. El sistema actual,
basado en procesos manuales y registros dispersos, presenta deficiencias graves en la
actualización de la disponibilidad de habitaciones y el agendamiento de estancias. Esta falta
de automatización genera errores operativos, sobreventa de cupos y una experiencia
deficiente para el cliente. La supervivencia y competitividad del negocio de Alberto
dependen de la transición hacia una solución digital centralizada que elimine la
incertidumbre en la gestión de reservas.
3. Objetivo del Proyecto
Desarrollar un Sistema de Reservas y Agendamiento de Hotel bajo el marco de trabajo
Scrum , con el fin de entregar una solución técnica eficiente, escalable y robusta. El objetivo
primordial es transformar los requisitos detectados en incrementos funcionales de software
que sean validados de forma temprana y frecuente por el cliente, permitiendo que el
producto final se adapte dinámicamente a la realidad operativa del hotel y garantice la
integridad de los datos de reserva.
4. Alcances del Proyecto y del Producto
Alcance del Proyecto (Compromisos del Equipo)
● Gestión integral del ciclo de vida bajo metodología Scrum.
● Refinamiento constante del Product Backlog basado en el feedback de Alberto.
● Configuración de entornos de desarrollo, control de versiones (Git) y tableros
colaborativos (Trello).
● Entrega de incrementos de software funcionales al término de cada Sprint.
● Documentación técnica y evidencias alojadas en el repositorio centralizado del
equipo.
Alcance del Producto (Funcionalidades del Sistema)
● Módulo de Disponibilidad: Visualización en tiempo real del estado de las
habitaciones.
● Motor de Reservas: Formulario de ingreso de datos de clientes y fechas de
estancia.
● Gestión de Agendamiento: Interfaz para administrar, editar y cancelar reservas
existentes.
● Seguridad y Acceso: Sistema de autenticación de usuarios según perfiles
(Admin/Recepcionista).
● Persistencia de Datos: Base de datos relacional para el almacenamiento seguro
de la información del hotel.
5. Metodología: Marco de Trabajo Scrum
Se implementará un modelo adaptativo e incremental (Scrum) , descartando el modelo
en cascada debido a la necesidad de validación constante con Alberto. Se han definido
Sprints con una duración fija de 2 semanas , permitiendo una cadencia de entrega regular.
Este enfoque permite mitigar riesgos técnicos de forma temprana y asegurar que el
desarrollo se mantenga alineado con las prioridades del negocio, permitiendo la evolución
del software mediante ciclos de inspección y adaptación.
6. Organización del Equipo Scrum (Roles)
● (yo)Product Owner: Responsable de la visión del producto y la rentabilidad del
proyecto. Actúa como el nexo principal con Alberto, prioriza el Product Backlog y
valida que cada incremento cumpla con las necesidades del hotel.
● (yo)Scrum Master: Facilitador experto que asegura la correcta aplicación de
Scrum. Encargado de remover impedimentos técnicos u organizativos, proteger al
equipo de interferencias externas y guiar la transición de requisitos ERS a historias
de usuario.
● (yo)Developer (Scrum Team): Equipo multidisciplinario encargado de la ejecución
técnica (diseño, codificación, pruebas). Son responsables de convertir los elementos
del backlog en incrementos de software que cumplan con la "Definition of Done".
7. Product Backlog Ampliado (Sprint Backlog)
ID,Ref. ERS,Enunciado de la Historia,Usuario,Artefacto,Componente (Épica),PTS,Esfuerzo
(Días),Duración (Semanas),Iteración (Sprint),Prioridad,Estado
HU-00,N/A,"Configurar ambiente de desarrollo, Git y diagramar Casos de
Uso.",Developer,Diagrama de Casos de Uso,Épica Cero:
Preparación,5,3,1,Pre-Sprint,Alta,Hecho
HU-01,RF-01,Ver disponibilidad de habitaciones en tiempo real.,Recepcionista,Vista de
Disponibilidad,Gestión de Estancias,8,5,1,1,Alta,Por hacer
HU-02,RF-02,Registrar una nueva reserva mediante formulario.,Cliente,Formulario de
Reserva,Gestión de Reservas,13,8,2,1,Alta,Por hacer
HU-03,RF-03,Modificar o cancelar reservas existentes.,Administrador,Interfaz de
Edición,Gestión de Reservas,8,5,1,2,Media,Por hacer
HU-04,RNF-01,Autenticar usuarios con credenciales seguras.,Usuario,Formulario de
Login,Seguridad,5,3,1,2,Alta,Por hacer
Nota: La estimación mantiene una velocidad constante proyectada, donde 1 punto de
historia equivale aproximadamente a 0.6 días de esfuerzo técnico focalizado.
8. Definition of Done (DoD) y Criterios de Aceptación
Para que una Historia de Usuario se considere finalizada y sea presentada en la Sprint
Review, debe cumplir con:
● Calidad de Código: Código fuente subido a GitHub, revisado por pares y sin
errores de compilación.
● Funcionalidad: El incremento cumple con el 100% de los criterios de aceptación de
la historia.
● Cumplimiento de Requisitos No Funcionales: Verificación de tiempos de
respuesta óptimos y encriptación básica de contraseñas.
● Documentación: Actualización del estado en Trello a "HECHO" y registro de
evidencias en Drive.
● Validación con el Usuario: Demostración funcional del artefacto ante el Product
Owner/Cliente.
9. Roadmap de Proyecto
El desarrollo se ejecutará en un periodo de 8 semanas, priorizando la reducción de
incertidumbre técnica.
● Semanas 1-2 (Fase de Preparación): Ejecución de la Épica Cero . Se entrega el
Artefacto "Diagrama de Casos de Uso" y la configuración del repositorio.
Justificación: Permite validar la arquitectura de datos antes de iniciar la lógica de
negocio.
● Semanas 3-4 (Sprint 1): Desarrollo del componente "Gestión de Estancias"
(Artefacto: Vista de Disponibilidad). Se inicia en paralelo el diseño del Artefacto
"Formulario de Reserva" . Justificación (De-risking): Validar la consulta de
disponibilidad es crítico para asegurar que el modelo de base de datos soporta la
concurrencia.
● Semanas 5-6 (Sprint 1 Cont.): Finalización del flujo de reservas. El desarrollo de la
lógica de guardado es secuencial al diseño del formulario para evitar retrabajo.
● Semanas 7-8 (Sprint 2): Implementación del componente de "Seguridad"
(Artefacto: Formulario de Login) y funciones administrativas. Justificación: Se
postergan las funciones de edición para asegurar primero que el núcleo de
generación de valor (la reserva) sea totalmente funcional.
10. Tecnologías y Herramientas de Gestión
● Trello: Gestión del flujo de trabajo con las columnas requeridas:
EPICA-COMPONENTE / POR HACER / HACIENDO / SPRINTREVIEW / HECHO .
● Git (GitHub): Control de versiones para el código fuente, garantizando el respaldo y
la trazabilidad de cada incremento.
● Miro: Utilizado para el modelamiento visual del Roadmap y el Diagrama de Casos
de Uso inicial.
● Google Drive: Repositorio central de evidencias del proyecto (Documento ERS,
Actas, Burndown).
11. Anexos
● Enlace al Tablero Trello:
https://trello.com/invite/b/69c8dd29b6e936af1ae199da/ATTId93786d0e6f4aaf04b59f
74297a6ea040B52F943/mi-tablero-de-trello
● Enlace al Repositorio de Código (GitHub):
https://github.com/maurrodriguezf/Project-Burndown-Sistema-de-Reservas-y-Agenda
miento-de-Hotel
● Enlace a Video Presentación (Máx. 7 min): Reunión en
General-20260330_072318-Grabación de la reunión.mp4
● Diagrama de Casos de Uso:
● Descripción: El diagrama modela el escenario principal donde el Recepcionista
consulta la disponibilidad y el Cliente interactúa con el sistema para realizar una
reserva. El sistema actúa como validador de las reglas de negocio, asegurando que
solo se agenden habitaciones en estado "Disponible", impactando directamente en
la eficiencia operativa de Alberto.
