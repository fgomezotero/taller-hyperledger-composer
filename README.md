# Taller Hyperledger Composer - Jornada Blockchain

Nuestro taller tiene como objetivo construir una red básica de blockchain Hyperledger Fabric utilizando el framework Hyperledger Composer y algunas herramientas para definir la definición del negocio que se va a modelar en la blockchain.
Todos los archivos incluidos en este repositorio, son el resultado de usar este archivo README como tutorial.

## Caso de uso: Cadena suministro de Atún
Vamos a crear una red blockchain genérica que modele una cadena de suministro de atún desde, que los ejemplares son capturados hasta que están listo para ser adquiridos en venta.
El proceso comienza con el pescador que realiza las capturas de los ejemplares en alta mar registrando en la blockchain (id, peso, tipo, estado,latitud, longitud, propietario, pesquero) y continua en el importador que compra los ejemplares a los pescadores.
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
1. Clic en `Deploy a new business network` 
2. En nombre de la red de negocio, teclee `atuncadena`
3. En tarjeta de admin de la red, type in `admin@atuncadena`
4. En plantilla, select `empty-business-network`
5. En la parte derecha, clic `deploy`
6. Seguidamente le mostrará una página con la red que acabamos de crear. En la red atuncadena, clic `connect now`.


## 1. Aprenda del lenguaje de modelado
Hyperledger Composer incluye un lenguaje de modelado orientado a objetos que se utiliza para definir el modelo de la red de negocio.
Un archivo .cto (archivo de modelo) de Hyperledger Composer se compone de los siguientes elementos:
1. Un solo espacio de nombres. Todas las declaraciones de recursos dentro del archivo están implícitamente en este espacio de nombres.
2. Un conjunto de definiciones de recursos, que abarca activos, transacciones, participantes y eventos.
3. Declaraciones de importación opcionales de recursos pertenecientes a otros espacios de nombres.

Los recursos en Hyperledger Composer incluyen:
- Activos, participantes, transacciones y eventos.
- Tipos enumerados.
- Conceptos.

Después de hacer clic en `connect now`, debe llevarlo a su editor. En el lado izquierdo, verá un `model file`. Lo primero que debemos hacer es cambiar nuestro espacio de nombres así que escribamos `org.ibm.coffee` para el espacio de nombres.

Comenzamos creando los participantes en la red. Primero crearemos una clase abstracta y luego crearemos las clases que heredarán a partir de ésta.

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

namespace org.taller.atun

abstract participant Entidad {
  o String organizacion
  o Direccion direccion
}

concept Direccion {
  o String ciudad optional
  o String pais default = "UY"
  o String cpostal regex=/^[0-9]{5}/ 
}

participant Pescador identified by pescadorId extends Entidad {
  o String pescadorId
}

participant Importador identified by importadorId extends Entidad {
     o String importadorId
}

participant Regulador identified by reguladorId extends Entidad{
  o String reguladorId
}

participant Expendedor identified by expendedorId extends Entidad{
  o String expendedorId
}
  
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

/**
 * Transacción que simula la captura de un atun por un pescador
 * @param {org.taller.atun.capturaAtun} atuntx The send message instance.
 * @transaction
 */
async function capturaAtun(atuntx) {
  
  const participantRegistry = await getParticipantRegistry('org.taller.atun.Pescador');
  var NS = 'org.taller.atun';
  var atun = getFactory().newResource(NS, 'Atun', Math.random().toString(36).substring(3));
  atun.lugarcaptura = atuntx.lugarcaptura;
  atun.peso = atuntx.peso;
  atun.tipo = atuntx.tipo;
  atun.pesquero = atuntx.pesquero;
  atun.owner = atuntx.pescador;
  atun.estado = "LISTO_PARA_DISTRIBUCION";
  const assetRegistry = await getAssetRegistry('org.taller.atun.Atun');
  await assetRegistry.add(atun);
  await participantRegistry.update(atuntx.pescador);
}


/**
 * Transferir un atún a un nuevo propietario.
 * @param {org.taller.atun.transferirAtun} atuntx The send message instance.
 * @transaction
 */
async function transferirAtun(atuntx) {
  
  if (atuntx.atunId.length <= 0) {
    throw new Error('Por favor entre el id del atún');
  }
  if (atuntx.newOwner.length <= 0) {
    throw new Error('Por favor entre un nuevo propietario');
  }
  const assetRegistry = await getAssetRegistry('org.taller.atun.Atun');
  const existe = await assetRegistry.exists(atuntx.atunId);
  
  if (existe) {
  	const atun = await assetRegistry.get(atuntx.atunId);
    
    atuntx.oldOwner = atun.owner;
    atun.owner = atuntx.newOwner;
   
    if (atuntx.tipo.toLowerCase() == 'importador') {

      const participantRegistry = await getParticipantRegistry('org.taller.atun.Importador');
      await participantRegistry.update(atuntx.newOwner);
      atun.estado = "IMPORTADO";
    } else {
      const participantRegistry = await getParticipantRegistry('org.taller.atun.Expendedor');
      await participantRegistry.update(atuntx.newOwner);
      atun.estado = "LISTO_PARA_LA_VENTA";
    }
    await assetRegistry.update(atun);  
  } else {
  	throw new Error('El id del atún que especificas no existe!');
  }
 }




