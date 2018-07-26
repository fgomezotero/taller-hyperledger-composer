# Taller Hyperledger Composer - Jornada Blockchain

Nuestro taller tiene como objetivo construir una red básica de blockchain Hyperledger Fabric utilizando el framework Hyperledger Composer y algunas herramientas para definir la definición del negocio que se va a modelar en la blockchain.
Todos los archivos incluidos en este repositorio, son el resultado de usar este archivo README como tutorial.

## Caso de uso: Cadena suministro de Atún
Vamos a crear una red blockchain genérica que modele una cadena de suministro de atún desde, que los ejemplares son capturados hasta que están listo para ser adquiridos en venta.
El proceso comienza con el pescador que realiza las capturas de los ejemplares en alta mar registrando en la blockchain (id, peso, latitud, longitud, propietario, barco) y continua en el importador que compra los ejemplares a los pescadores.
Luego existe una entidad reguladora que se encarga de que las capturas realizadas sean legales revisando las zonas de pescas de cada ejemplar y finalmente los ejemplares de atún se mueven en la cadena de suministro hacia el expendedor que será el encargado de su venta.

## Aclaración:
Nuestro rol será el del regulador, que se encargará de revisar que todas capturas cumplen con las regulaciones internacioles evitando la pezca ilegal. Utilizando una simple consulta para obtener la información de los ejemplares capturados.

## Pasos:
1. [Aprenda del lenguaje de modelado](#1-aprenda-del-lenguaje-de-modelado) 
2. [Aprenda sobre las funciones del procesador de transacciones](#2-aprediendo-de-las-funciones-del-procesador-de-transacciones)
3. [Aprenda de ACL](#3-aprenda-de-acl)
4. [Aprenda como hacer consultas](#4-aprenda-como-hacer-consultas) 
5. [Probando la red](#5-probando-la-red) 
6. [Exportar la red de negocio](#6-exportar-la-red-negocio)
7. [Desplegar en una red Fabric básica](#7-desplegar-en-una-red-fabric-básica)
8. [Generar las API-Rest y una app en Angular](#8-generar-las-api-rest-y-una-app-en-angular)

## Requisitos:
Conectarte a: https://composer-playground.mybluemix.net
1. Click en `Deploy a new business network` 
2. En nombre de la red de negocio, teclee `atuncadena`
3. En tarjeta de admin de la red, type in `admin@atuncadena`
4. En plantilla, select `empty-business-network`
5. En la parte derecha, click `deploy`
6. Seguidamente le mostrará una página con la red que acabamos de crear. En la red atuncadena, click `connect now`.


## 1. Aprenda del lenguaje de modelado
Hyperledger Composer incluye un lenguaje de modelado orientado a objetos que se utiliza para definir el modelo de la red de negocio.
Un archivo .cto (archivo de modelo) de Hyperledger Composer se compone de los siguientes elementos:
1. Un solo espacio de nombres. Todas las declaraciones de recursos dentro del archivo están implícitamente en este espacio de nombres.
2. Un conjunto de definiciones de recursos, que abarca activos, transacciones, participantes y eventos.
3. Optional import declarations that import resources from other namespaces.



