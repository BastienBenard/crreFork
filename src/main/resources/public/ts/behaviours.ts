import { Behaviours } from 'entcore';

Behaviours.register('crre', {
    rights: {
        workflow: {
            access: 'fr.openent.crre.controllers.CrreController|view',
            administrator: 'fr.openent.crre.controllers.AgentController|createAgent',
            manager: 'fr.openent.crre.controllers.AgentController|getAgents',
            //TODO à changer mettre au bon endroit
            validator: 'fr.openent.crre.controllers.AgentController|updateAgent'
        },
        resource: {}
    }
});
