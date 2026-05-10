# Gastly — Product One-Pager

> *Saber en qué gastás, sin que sea un trabajo.*

---

## El problema

Las parejas y hogares argentinos no saben cuánto gastan ni en qué. No porque no les importe, sino porque las herramientas existentes generan más fricción de la que resuelven: apps genéricas con onboarding largo, categorías que no aplican, sin soporte para el peso argentino, sin dólar blue, y sin forma de compartir el registro con otra persona.

El resultado es siempre el mismo: se empieza con entusiasmo, se abandona a las dos semanas, y el hogar sigue operando a ciegas.

**El costo real no es financiero — es cognitivo.** Cada fin de mes, la pregunta "¿a dónde se fue la plata?" genera una discusión que nadie quiere tener.

---

## La propuesta de valor

Gastly hace que registrar un gasto sea tan rápido como mandarse un mensaje. Una línea de texto — *"1500 super"*, *"u50 netflix"* — y listo. Sin formularios, sin categorías manuales, sin fricciones.

Lo que diferencia a Gastly:

- **Velocidad de captura.** El input de lenguaje natural parsea monto, moneda y categoría en tiempo real. El gasto se guarda en segundos.
- **Compartido de verdad.** Ambos miembros del hogar ven el mismo registro en tiempo real. No hay sincronización, no hay "mandame el excel".
- **ARS + USD nativos.** El dólar blue es parte de la realidad financiera argentina. Gastly convierte automáticamente con cotización del día — sin que el usuario tenga que pensar en eso.
- **Resumen que se entiende.** Una pantalla con el total, el gráfico, el desglose por categoría, el promedio histórico y la comparación. Todo el análisis que antes requería una hoja de cálculo.
- **Memoria de compromisos fijos.** Los gastos recurrentes (alquiler, expensas, servicios) tienen su propio checklist mensual. Nunca más "¿pagaste el internet?".

---

## Usuario

**Usuario primario:** Adultos de 25–45 años en pareja o convivencia, con ingresos en ARS y/o USD, que hacen compras frecuentes y quieren tener control sin complicarse.

**Perfil típico:**
- Trabaja en relación de dependencia o freelance
- Tiene gastos mixtos: supermercado, servicios, salidas, suscripciones
- Maneja dólares blue como reserva o ingreso parcial
- Ya intentó otras apps y las abandonó por fricción o por no adaptarse al contexto argentino
- Quiere saber cuánto gasta, no gestionar un presupuesto detallado

**Usuario secundario:** El otro miembro del hogar. Accede con su propia cuenta, registra sus gastos, ve el mismo resumen compartido. No necesita ser el "administrador" — solo participar.

---

## Audiencia

Gastly no es para todos. Es específicamente para:

- **Hogares argentinos** con economía bimoneda (ARS + USD)
- **Parejas o convivientes** que comparten gastos y quieren visibilidad conjunta
- **Personas que ya intentaron controlar sus gastos** y abandonaron por fricción, no por falta de interés

No es para usuarios que buscan presupuestación detallada por categoría, planificación de inversiones, o integración bancaria automática.

---

## Visión

**En 3 años:** Gastly es la app de referencia para hogares argentinos que quieren entender su plata sin que sea un trabajo de contador. La abren todos los días — al cargar un gasto, al revisar el cierre del mes, al verificar que el alquiler ya fue pagado.

**La promesa central:** Gastly hace que la conversación sobre dinero en el hogar sea sobre decisiones — no sobre datos faltantes.

El norte no es ser la app más completa. Es ser la app que la gente realmente usa.

---

## Product Principles

### 1. Velocidad primero
Cada pantalla tiene una acción principal. El registro de un gasto tiene que poder completarse en menos de 10 segundos. Si algo agrega pasos, se justifica o se elimina.

### 2. Contexto argentino como ventaja, no como edge case
ARS, USD, dólar blue, inflación, gastos en cuotas — no son casos especiales, son la norma. Gastly los trata como ciudadanos de primera clase.

### 3. Compartido sin fricción
El modelo de workspace compartido existe para que ambos miembros participen naturalmente, sin roles artificiales ni permisos complicados. Lo que ve uno, lo ve el otro.

### 4. Análisis sin esfuerzo
El usuario no debería tener que construir su propio análisis. Gastly pre-computa lo que importa: total del mes, comparación con el promedio, desglose por categoría. Los datos crudos están, pero el insight llega solo.

### 5. Sin ruido
Gastly no agrega features para parecer completo. Cada función existe porque resuelve un problema real del usuario target. Lo que no agrega valor para ese usuario no entra, aunque sea fácil de construir.

### 6. Confianza en los datos
La app no puede equivocarse con los montos, las fechas, ni las conversiones. La confianza se construye con precisión — no con animaciones ni diseño. Un error de cálculo destruye la relación más rápido que cualquier bug de UX.

---

## Estado actual (mayo 2026)

Gastly está en uso activo por un hogar real. Las funciones core están shipped:

| Área | Estado |
|------|--------|
| Registro de gastos (NLP) | ✅ Producción |
| Workspace compartido + invites | ✅ Producción |
| Resumen con gráfico y categorías | ✅ Producción |
| Presets de período (Esta sem., Este mes, etc.) | ✅ Producción |
| Promedio histórico con delta % | ✅ Producción |
| Conversión ARS/USD con dólar blue | ✅ Producción |
| Lista de compras compartida | ✅ Producción |
| Gastos fijos (checklist mensual) | ✅ Producción |
| Vista semanal en Resumen | ✅ Producción |

---

*Gastly — construido para el hogar argentino real.*
