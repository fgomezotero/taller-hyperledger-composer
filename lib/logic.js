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

'use strict';
/**
 * Write your transction processor functions here
 */

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
