package fr.openent.crre.service.impl;

import fr.openent.crre.Crre;
import fr.openent.crre.core.constants.Field;
import fr.openent.crre.model.neo4j.Neo4jUserModel;
import fr.openent.crre.service.UserService;
import fr.wseduc.webutils.Either;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.neo4j.Neo4j;
import org.entcore.common.neo4j.Neo4jResult;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DefaultUserService implements UserService {
    private static final Logger log = LoggerFactory.getLogger(DefaultUserService.class);

    @Override
    public void getStructures(String userId, Handler<Either<String, JsonArray>> handler) {
        String query = "MATCH (a:Action {displayName:'crre.access'})<-[AUTHORIZE]-(:Role)" +
                "<-[AUTHORIZED]-(g:Group)-[:DEPENDS]->(s:Structure), " +
                "(u:User {id:{userId}})-[:IN]->(g) return DISTINCT s.id as id, s.name as name, s.UAI as UAI, s.type";
        JsonObject params = new JsonObject()
                .put("userId", userId);
        Neo4j.getInstance().execute(query, params, Neo4jResult.validResultHandler(handler));
    }

    @Override
    public Future<Map<Neo4jUserModel, String>> getValidatorUser(List<String> structureIdList) {
        Promise<Map<Neo4jUserModel, String>> promise = Promise.promise();

        String query = "MATCH (s:Structure)<--()--(u:User)-->(g:Group)-->(r:Role)-[:AUTHORIZE]->(w:WorkflowAction{displayName:'" + Crre.VALIDATOR_RIGHT + "'})" +
                " WHERE s.id IN {structureIdList}" +
                " WITH r,u,s" +
                " MATCH (wa:WorkflowAction{displayName:'" + Crre.ADMINISTRATOR_RIGHT + "'})" +
                " WHERE NOT ((r)-[:AUTHORIZE]->(wa))" +
                " return distinct u,s.id";
        JsonObject params = new JsonObject()
                .put("structureIdList", structureIdList);

        Neo4j.getInstance().execute(query, params, Neo4jResult.validResultHandler(stringJsonArrayEither -> {
            if (stringJsonArrayEither.isRight()) {
                final Map<Neo4jUserModel, String> userStructureMap = stringJsonArrayEither.right().getValue().stream()
                        .filter(JsonObject.class::isInstance)
                        .map(JsonObject.class::cast)
                        .collect(Collectors.toMap(jsonObject -> new Neo4jUserModel(jsonObject.getJsonObject(Field.U)), jsonObject -> jsonObject.getString("s.id")));
                promise.complete(userStructureMap);
            } else {
                log.error(String.format("[CRRE@%s::getValidatorUser] Fail to get validator user %s",
                        this.getClass().getSimpleName(), stringJsonArrayEither.left().getValue()));
                promise.fail(stringJsonArrayEither.left().getValue());
            }
        }));

        return promise.future();
    }
}