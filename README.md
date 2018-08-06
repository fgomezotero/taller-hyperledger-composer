# Taller Hyperledger Composer - Jornada Blockchain

Nuestro propósito con la elaboración de este taller es que los participantes, una vez concluido el mismo, cuenten con los conocimientos necesarios para abordar el desarrollo y modelado 
de un negocio con la herramienta Hyperledger Composer, además de estimular el estudio en profundidad de esta tecnología.

Partiendo de esta premisa tenemos como objetivo elaborar una guía en forma de tutorial que modela un caso de uso utilizando el frawework Hyperledger Composer.

## Caso de Uso: Cadena de suministro de Atún
Vamos a crear una red blockchain genérica que modele una cadena de suministro de atún, desde que los ejemplares son capturados hasta que están listos para ser adquiridos en venta.
El proceso comienza con el pescador que realiza las capturas de los ejemplares en alta mar, registrando dicha captura en la blockchain a partir de diversos campos (id, peso, tipo, latitud, longitud, propietario, pesquero) 
y continúa en el importador que compra los ejemplares a los pescadores. Existe una entidad reguladora que se encarga de que las capturas realizadas sean legales revisando las zonas de pesca de cada ejemplar y finalmente los ejemplares de atún se mueven en la cadena de suministro hacia el expendedor que será el encargado de su venta.

## Aclaración:
El rol de regulador lo asumiremos nosotros, utilizando una serie de consultas para obtener la información de los ejemplares capturados.

## Pasos:
1. [Aprenda del lenguaje de modelado](#1-aprenda-del-lenguaje-de-modelado) 
2. [Aprenda sobre las funciones del procesador de transacciones](#2-aprenda-sobre-las-funciones-del-procesador-de-transacciones)
3. [Aprenda de ACL](#3-aprenda-de-acl)
4. [Aprenda como hacer consultas](#4-aprenda-como-hacer-consultas) 
5. [Probando la red](#5-probando-la-red) 
6. [Exportar la red de negocio](#6-exportar-la-red-de-negocio)
7. [Desplegar en una red Fabric básica](#7-desplegar-en-una-red-fabric-básica)
8. [Generar las API-Rest y una app en Angular](#8-generar-las-api-rest-y-una-app-en-angular)

## Requisitos:
Conectarte a: https://composer-playground.mybluemix.net
1. Clic en `Deploy a new business network` 
2. En "nombre de la red de negocio", digite `atun-network`
3. En "tarjeta de admin de la red", digite in `admin@atun-network`
4. En "plantilla", elija `empty-business-network`
5. En la parte derecha, haga clic en`deploy`
6. Seguidamente se mostrará una página con la red que acabamos de crear. En la red atun-network, haga clic en `connect now`.


## 1. Aprenda del lenguaje de modelado
Hyperledger Composer incluye un lenguaje de modelado orientado a objetos que se utiliza para definir el modelo de la red de negocio.
Un archivo .cto (archivo de modelo) de Hyperledger Composer se compone de los siguientes elementos:
1. Un solo espacio de nombres. Todas las declaraciones de recursos dentro del archivo están implícitas en este espacio de nombres.
2. Un conjunto de definiciones de recursos, que abarca activos, transacciones, participantes y eventos.
3. Declaraciones de importación de recursos opcionales pertenecientes a otros espacios de nombres.

Los recursos en Hyperledger Composer incluyen:
- Activos, participantes, transacciones y eventos.
- Tipos enumerados.
- Conceptos.

Después de hacer clic en `connect now`, debe llevarlo a su editor. En el lado izquierdo, verá un `model file`. Lo primero que debemos hacer es cambiar nuestro espacio de nombres así que escribamos `org.taller.atun` para el espacio de nombres.

Comenzamos creando los participantes en la red. Primero crearemos una clase abstracta y luego crearemos las clases que heredarán a partir de ésta.

```
namespace org.taller.atun

abstract participant Entidad {
  o String organizacion
  o Direccion direccion
}
```

La clase anterior requiere dos campos: la organización, que es de tipo String y la dirección que es de tipo concepto.
Los conceptos son clases abstractas que no son activos, ni participantes ni transacciones.

A continuación creamos el concepto Direccion:
```
concept Direccion {
  o String ciudad optional
  o String pais default = "UY"
  o String cpostal regex=/^[0-9]{5}/ 
}
```

### Creación de los participantes
Seguidamente creamos los participantes de nuestra definición de red de negocio, que heredan de la clase abstracta Entidad.

```
participant Pescador identified by pescadorId extends Entidad {
  o String pescadorId
}

participant Importador identified by importadorId extends Entidad {
     o String importadorId
}

participant Expendedor identified by expendedorId extends Entidad{
  o String expendedorId
}

```

### Creación del activo
Ahora vamos a crear nuestro primer activo, Atun. Tenemos que tener un identificador único del activo
`atunid` por el cual vamos a realizar la consulta de un determinado activo. Recuerde que el rol del regulador es consultar las capturas para ver cuál fue realizada ilegalmente.

```
asset Atun identified by atunId {
  o String atunId
  o Double peso
  o Lugar lugarcaptura
  o Tipo tipo
  o Estado estado
  o String pesquero
  --> Entidad owner
}

concept Lugar {
  o Double latitud
  o Double longitud
}
```
### Creación de los unumerativos
El tipo enumerativo es usado para cuando un atributo tiene desde 1 a N posibles valores que son conocidos. Para nuestro ejemplo tenemos 3 enumerativos:

``` 
enum Estado {
  o LISTO_PARA_DISTRIBUCION
  o IMPORTADO
  o LISTO_PARA_LA_VENTA
}
  
enum Tipo {
  o ROJO
  o ALETA_AMARILLA
  o BLANCO
  o ALETA_NEGRA
  o COLA_LARGA
}
 
enum Propietario {
  o PESCADOR
  o IMPORTADOR
  o EXPENDEDOR
}
```

## Creación de las transacciones
Vamos a crear el esquema de datos de nuestras transacciones como se muestra a continuación:

```
transaction capturaAtun{
  o Double peso
  o Lugar lugarcaptura
  o Tipo tipo
  o String pesquero
  --> Pescador pescador
}
  
transaction transferirAtun {
  --> Entidad newOwner
  --> Entidad oldOwner
  o String atunId
  o Propietario tipo
}
```
## Creamos un evento para emitirlo que cada vez que cambie el dueño de una captura
```
event NewTransferEvent {
  --> Atun atun
  --> Entidad newOwner
  --> Entidad oldOwner
}
```

La transacción capturaAtun es la encargada de dar de alta en el registro las capturas de atún que se van realizando por los pescadores.
Por otra parte, la transacción  tranferiratun toma o se relaciona con dos tipos de Entidad, uno es el nuevo dueño y otro es el dueño anterior. El atributo tipo será el tipo esperado del nuevo dueño del activo.

Esto es todo lo que, por ahora, definiremos en el archivo .cto.


## 2. Aprenda sobre las funciones del procesador de transacciones
Ahora vamos a escribir el corazón de nuestra aplicación. El fichero .js nos permite añadir la lógica del negocio para cada una de las transacciones que creamos anteriormente.

Necesitamos implementar dos transacciones. Para hacerlo, tenemos que crear primeramente nuestro fichero .js. Hacemos clic en `add a file` en la parte inferior de la barra o zona izquierda. Pulsamos en `Script file .js`, y luego `add`. Debería ver el fichero en la barra o zona lateral izquierda.

### Creamos la transacción capturaAtun

```
/**
 * Transacción que simula la captura de un atun por un pescador
 * @param {org.taller.atun.capturaAtun} atuntx The send message instance.
 * @transaction
 */
async function capturaAtun(atuntx) {
  
  // Accedo al registro de los participantes de tipo Pescador
  const participantRegistry = await getParticipantRegistry('org.taller.atun.Pescador');
  
  // Creo una nuevo recurso de tipo Atun con el atributo atunId generado automaticamente
  var NS = 'org.taller.atun';
  var atun = getFactory().newResource(NS, 'Atun', Math.random().toString(36).substring(3));
  
  // Termino de llenar el resto de los atributos de la instancia de tipo Atun.
  atun.lugarcaptura = atuntx.lugarcaptura;
  atun.peso = atuntx.peso;
  atun.tipo = atuntx.tipo;
  atun.pesquero = atuntx.pesquero;
  atun.owner = atuntx.pescador;
  atun.estado = "LISTO_PARA_DISTRIBUCION";
  
  // Accedo al registro de tipo Atun e inserto la instancia que acabo de crear.
  const assetRegistry = await getAssetRegistry('org.taller.atun.Atun');
  await assetRegistry.add(atun);
  
  //Actualizo el registro de tipo pescador.
  await participantRegistry.update(atuntx.pescador);
}
```
### Creamos la transacción transferirAtun

```
/**
 * Transferir un atún a un nuevo propietario.
 * @param {org.taller.atun.transferirAtun} atuntx The send message instance.
 * @transaction
 */
async function transferirAtun(atuntx) {

  // Primeramente realizamos unos chequeos de posibles entrada erróneas de datos
  if (atuntx.atunId.length <= 0) {
    throw new Error('Por favor entre el id del atún');
  }
  if (atuntx.newOwner.length <= 0) {
    throw new Error('Por favor entre un nuevo propietario');
  }
  
  // Accedemos al registro de tipo Atún y vemos si el atún que queremos tranferir existe
  const assetRegistry = await getAssetRegistry('org.taller.atun.Atun');
  const existe = await assetRegistry.exists(atuntx.atunId);
  
  if (existe) {
    // Si existe los seleccionamos del registro.
  	const atun = await assetRegistry.get(atuntx.atunId);
    
	// Cambiamos su dueño y guardamos el dueño anterior para má adelante utilizarlo en la generación de un evento
    atuntx.oldOwner = atun.owner;
    atun.owner = atuntx.newOwner;
	
    // Definimos una lógica simple de tranferencia de atún para cuando el nuevo dueño es un Importador
    if (atuntx.tipo.toLowerCase() == 'importador') {

      const participantRegistry = await getParticipantRegistry('org.taller.atun.Importador');
      await participantRegistry.update(atuntx.newOwner);
      atun.estado = "IMPORTADO";
    } else { // Cuando el nuevo dueño va ser el Expendedor
      const participantRegistry = await getParticipantRegistry('org.taller.atun.Expendedor');
      await participantRegistry.update(atuntx.newOwner);
      atun.estado = "LISTO_PARA_LA_VENTA";
    }
	// Actualizamos en el registro la instancia de atún que cambiamos de propietario y estado
    await assetRegistry.update(atun);
    
    // Emito un evento para el activo modificado
    let event = getFactory().newEvent('org.taller.atun', 'NewTransferEvent');
    event.atun = atun;
    event.oldOwner = atuntx.oldOwner;
    event.newOwner = atuntx.newOwner;
    emit(event);
    
  } else {
  	throw new Error('El id del atún que especificas no existe!');
  }
 }
```
## 3. Aprenda de ACL

Hyperledger Composer incluye un lenguaje de control de acceso (ACL) que proporciona control de acceso declarativo sobre los elementos del modelo de negocio. Al definir las reglas
de ACL, puede determinar qué usuarios / roles tienen permiso para crear, leer, actualizar o eliminar elementos en el modelo de red de negocio.

Como estamos configurando una red básica, vamos a mantener el archivo por defecto que viene con la red que estamos modelando, no necesitamos modificar nada de este archivo. Para aprender más sobre las 
ACL diríjase a https://hyperledger.github.io/composer/latest/reference/acl_language

A continuación, un pequeño ejemplo de una regla que podemos aplicar a nuestro negocio:

```
rule EjemploReglaCondicional {
    description: "Description of the ACL rule"
    participant(p): "org.taller.atun.Entidad"
    operation: ALL
    resource(r): "org.taller.atun.Atun"
    condition: (r.owner.getIdentifier() == p.getIdentifier())
    action: ALLOW
}
```
## 4. Aprenda como hacer consultas
Ya casi estamos listo para probar la red de negocio. Vamos a construir dos consultas ambas con el fin de que el regulador pueda auditar las capturas.
La primera es acceder a una captura específica y la otra devuelve el listado de las transacciones que se realizaron sobre determinada captura.

```
query getAtunItem{ 
  description: "Te muestra una captura específica dado su id" 
  statement: 
  		SELECT org.taller.atun.Atun
  			WHERE (atunId == _$atunId ) 
}

query getCapturaHistory { 
  description: "Mostrar todos las transacciones realizadas sobre una captura" 
  statement: 
  		SELECT org.taller.atun.transferirAtun
  			WHERE (atunId == _$atunId ) 
  				ORDER BY [timestamp]
}
```
Bien estamos listo para probar la red!!!.

## 5. Probando la red
Para probar la red, hacemos clic en el tab `test` , en la parte superior de la página. Primeramente vamos a crear los participantes y luego vamos a ejecutar la transacción capturaAtun para 
añadir nuevas capturas a la red. Clic en `Create new participant` una vez seleccionado el participante requerido.

### Creando los participantes

Ahora, damos clic en el Expendedor y añadimos el siguiente json:

```
{
  "$class": "org.taller.atun.Expendedor",
  "expendedorId": "expendedor1",
  "organizacion": "Emp3",
  "direccion": {
    "$class": "org.taller.atun.Direccion",
    "pais": "UY",
    "cpostal": "11300"
  }
}
``` 
Ahora, damos clic en el Importador y añadimos el siguiente json:

```
{
  "$class": "org.taller.atun.Importador",
  "importadorId": "importador1",
  "organizacion": "Emp2",
  "direccion": {
    "$class": "org.taller.atun.Direccion",
    "pais": "UY",
    "cpostal": "11000"
  }
}
```

Ahora damos clic en el Pescador y añadimos el siguiente json:

```
{
  "$class": "org.taller.atun.Pescador",
  "pescadorId": "pescador1",
  "organizacion": "Emp1",
  "direccion": {
    "$class": "org.taller.atun.Direccion",
    "pais": "UY",
    "cpostal": "11000"
  }
}
```

### Creando el activo
Una vez creados los participantes de la red podemos crear el activo atun manualmente o a través de la ejecución de la transacción capturaAtun. En caso de que queramos hacerlo manualmente
damos clic en el activo Atun y luego al botón `+ Create New Asset`, añadiendo luego el siguiente json:

``` 
{
  "$class": "org.taller.atun.Atun",
  "atunId": "atun1",
  "peso": 30,
  "lugarcaptura": {
    "$class": "org.taller.atun.Lugar",
    "latitud": -57.1,
    "longitud": -34.34
  },
  "tipo": "ROJO",
  "estado": "LISTO_PARA_DISTRIBUCION",
  "pesquero": "Pesquero1",
  "owner": "resource:org.taller.atun.Pescador#pescador1"
}
``` 
Podemos hacer uso de la transacción capturaAtun; para ello damos clic en el botón `Submit Transaccion` y escogemos la transacción capturaAtun. En este caso no es necesario 
añadir todos los datos anteriores porque la misma lógica de implementación de la transacción genera el atunId.

### Enviando la transacción transferirAtun
Ahora vamos a realizar el proceso anterior pero escogiendo la transacción transferirAtun, la cual cambiará el dueño del atun en la cadena de suministro, así como el estado del activo. 
Pegamos el siguiente fragmento json:

```
{
  "$class": "org.taller.atun.transferirAtun",
  "newOwner": "resource:org.taller.atun.Importador#importador1",
  "oldOwner": "resource:org.taller.atun.Pescador#pescador1",
  "atunId": "atun1",
  "tipo": "IMPORTADOR"
}
```
Seguimos hacia delante en la cadena de suministro y volvemos a ejecutar el paso anterior, pero ahora con el siguiente json:

```
{
 "$class": "org.taller.atun.transferirAtun",
 "newOwner": "resource:org.taller.atun.Expendedor#expendedor1",
 "oldOwner": "resource:org.taller.atun.Importador#Importador1",
 "atunId": "atun1",
 "tipo": "EXPENDEDOR"
}
```
Si verificamos el activo vemos que el estado es `LISTO_PARA_LA_VENTA`, es decir que el dueño es ahora el expendedor: hemos simulado la transferencia de un activo en la blockchain.

## 6. Exportar la red de negocio
Haga Clic en `define` en la parte superior de la página. Luego damos clic en `export` en la zona izquierda. Automáticamente se descargará un fichero con extensión .bna (Business Network Archive).
Dicho fichero contiene la información necesaria para instalar la red de negocio en los peer.

## 7. Desplegar en una red Fabric básica
Después de crear el archivo .bna, la red de negocio se puede implementar en la instancia de Hyperledger Fabric. Normalmente, se requiere información del administrador de Fabric para crear una identidad PeerAdmin, 
con privilegios para instalar la chaincode en los peer, así como también iniciar la chaincode en el canal. Sin embargo, como parte de la instalación del entorno de desarrollo, ya se ha creado una identidad PeerAdmin.

Después de que se haya instalado la red de negocio podemos iniciarla. Para mejores prácticas, se debe crear una nueva identidad para administrar la red de negocio después de la implementación. Esta identidad se conoce como administrador de red de negocio.

### Instalando la red de negocio

```
#composer network install --card PeerAdmin@hlfv1 --archiveFile atun-network.bna
```
Es muy importante que guardemos el número de la versión que nos devuelve el comando anterior, dado que nos va a hacer falta más adelante.

### Para iniciar la red de negocio
```
#composer network start --networkName atun-network --networkVersion version_devuelta_cmd_anterior --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
```

### Importar la identidad del administrador de red como una tarjeta de red de negocio utilizable
```
#composer card import --file networkadmin.card
```

### Comprobar si la red fue desplegada correctamente

```
#composer network ping --card admin@atun-network
```

## 8. Generar las API-Rest y una app en Angular
Hyperledger Composer puede generar una API REST a medida basada en una red de negocio. Para desarrollar una aplicación web, la API REST proporciona una capa útil de abstracción de lenguaje.

```
#composer-rest-server
```

Hyperledger Composer también puede generar una aplicación Angular ejecutándose contra la API REST.

```
#yo hyperledger-composer:angular
```
Luego nos movemos para la carpeta del proyecto creado y ejecutamos: `#npm start`.
