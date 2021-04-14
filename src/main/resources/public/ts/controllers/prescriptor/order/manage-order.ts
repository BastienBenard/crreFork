import {moment, ng, toasts} from 'entcore';
import {
    BasketsOrders,
    Filters,
    OrderClient,
    OrdersClient,
    Utils
} from '../../../model';
import {INFINITE_SCROLL_EVENTER} from "../../../enum/infinite-scroll-eventer";

declare let window: any;

export const manageOrderController = ng.controller('manageOrderController',
    ['$scope', '$routeParams', async ($scope, $routeParams) => {

        $scope.allOrdersListSelected = false;
        $scope.show = {
            comment: false
        };
        ($scope.ordersClient.selected[0]) ? $scope.orderToUpdate = $scope.ordersClient.selected[0] : $scope.orderToUpdate = new OrderClient();
        $scope.filter = {
            page: 0
        };
        $scope.isDate = false;
        $scope.isOld = false;
        $scope.filtersDate = [];
        $scope.filtersDate.startDate = moment().add(-1, 'years')._d;
        $scope.filtersDate.endDate = moment()._d;
        $scope.displayedBasketsOrders = [];
        $scope.loading = true;
        $scope.displayedBasketsOrders = [];
        const currencyFormatter = new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'});
        this.init = () => {
            $scope.reassorts = [{reassort: "true"}, {reassort: "false"}];
            $scope.filters = new Filters();
        };

        $scope.exportCSV = () => {
            let order_selected = [];
            $scope.displayedBasketsOrders.forEach(function (basket) {
                basket.orders.forEach(function (order) {
                    if (order.selected) {
                        order_selected.push(order);
                    }
                });
            });
            if (order_selected.length == 0) {
                order_selected = $scope.ordersClient.all;
            }
            let params_id_order = Utils.formatKeyToParameter(order_selected, 'id');
            let equipments_key = order_selected.map((value) => value.equipment_key).filter((value, index, _arr) => _arr.indexOf(value) == index);
            let params_id_equipment = Utils.formatKeyToParameter(equipments_key.map(s => ({equipment_key: s})), "equipment_key");
            let url = `/crre/orders/`
            if($scope.isOld) {
                url += `old/`;
            }
            window.location = url + `exports?${params_id_order}&${params_id_equipment}`;
            $scope.displayedBasketsOrders.forEach(function (basket) {
                basket.selected = false;
                basket.orders.forEach(function (order) {
                    order.selected = false;
                });
            });
        };

        $scope.filterByDate = async () => {
            if($scope.isDate) {
                if (moment($scope.filtersDate.startDate).isSameOrBefore(moment($scope.filtersDate.endDate))) {
                    await $scope.searchByName(false);
                } else {
                    toasts.warning('crre.date.err');
                }
                $scope.isDate = false;
            } else {
                $scope.isDate = true;
            }
        };

        $scope.startInitLoading = () => {
            $scope.loading = true;
            $scope.filter.page = 0;
            $scope.displayedBasketsOrders = [];
            $scope.basketsOrders = new BasketsOrders();
            Utils.safeApply($scope);
        }

        $scope.searchByName = async (noInit?: boolean) => {
            if (!noInit) {
                $scope.startInitLoading();
            }
            if ($scope.filters.all.length > 0) {
                await $scope.newBasketsOrders.filter_order($scope.filters.all, $scope.campaign.id, $scope.filtersDate.startDate,
                    $scope.filtersDate.endDate, $scope.query_name, $scope.filter.page, $scope.isOld);
                return await $scope.synchroMyBaskets(true, $scope.isOld);
            } else {
                if ($scope.query_name && $scope.query_name != "") {
                    await $scope.newBasketsOrders.search($scope.query_name, $scope.campaign.id, $scope.filtersDate.startDate,
                        $scope.filtersDate.endDate, $scope.filter.page, $scope.isOld);
                    return await $scope.synchroMyBaskets(true, $scope.isOld);
                } else {
                    return await $scope.synchroMyBaskets(false, $scope.isOld);
                }
            }
        }

        $scope.onScroll = async (): Promise<void> => {
            $scope.filter.page++;
            await $scope.searchByName(true);
        };

        $scope.synchroMyBaskets = async (search?: boolean, old = false): Promise<boolean> => {
            if (!search) {
                $scope.newBasketsOrders = new BasketsOrders();
                if ($routeParams.idCampaign) {
                    await $scope.newBasketsOrders.getMyOrders($scope.filter.page, $scope.filtersDate.startDate,
                        $scope.filtersDate.endDate, $routeParams.idCampaign, old);
                }
            }
            if ($scope.newBasketsOrders.all.length != 0) {
                let ordersId = [];
                $scope.newBasketsOrders.forEach((order) => {
                    ordersId.push(order.id);
                });
                $scope.newOrders = new OrdersClient();
                await $scope.newOrders.sync(null, $scope.filtersDate.startDate, $scope.filtersDate.endDate, [],
                    $routeParams.idCampaign, $scope.current.structure.id, ordersId, null, old);
                formatDisplayedBasketOrders();
                $scope.$broadcast(INFINITE_SCROLL_EVENTER.UPDATE);
            }
            $scope.loading = false;
            Utils.safeApply($scope);
            return $scope.newBasketsOrders.all.length === 0;
        };

        const formatDisplayedBasketOrders = (): void => {
            $scope.newBasketsOrders.forEach(function (basketOrder) {
                let displayedBasket = basketOrder;
                displayedBasket.name_user = displayedBasket.name_user.toUpperCase();
                displayedBasket.total = currencyFormatter.format(basketOrder.total);
                displayedBasket.created = moment(basketOrder.created).format('DD-MM-YYYY').toString();
                displayedBasket.expanded = false;
                displayedBasket.orders = [];
                $scope.newOrders.forEach(function (order) {
                    if (order.id_basket === basketOrder.id) {
                        displayedBasket.orders.push(order);
                    }
                });
                if (displayedBasket.orders.length > 0) {
                    Utils.setStatus(displayedBasket, displayedBasket.orders[0]);
                }
                $scope.displayedBasketsOrders.push(displayedBasket);
                $scope.basketsOrders.all.push(basketOrder);
            });
        };

        this.init();
        await $scope.synchroMyBaskets(false);
    }]);
