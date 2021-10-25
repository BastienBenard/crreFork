import {ng, template} from 'entcore';
import {Filter, Utils} from '../../../model';
import http from "axios";

export const statsController = ng.controller('statsController', [
    '$scope', async ($scope) => {
        $scope.filterChoice = {
            schoolType: [],
            docType: [],
            reassorts: [],
            years: [],
            schoolOrientation: []
        };
        $scope.docsType = [{name: 'Papier'}, {name: 'Numerique'}];
        $scope.schoolType = [{name: 'Public'}, {name: 'Privé'}];
        $scope.reassorts = [{name: 'true'}, {name: 'false'}];
        $scope.schoolOrientation = [{name: 'LG'}, {name: 'LP'}];


        $scope.schoolType.forEach((item) => item.toString = () => $scope.translate(item.name));
        $scope.docsType.forEach((item) => item.toString = () => $scope.translate(item.name));
        $scope.reassorts.forEach((item) => item.toString = () => $scope.translate(item.name));
        $scope.schoolOrientation.forEach((item) => item.toString = () => $scope.translate(item.name));


        let { data } = await http.get(`/crre/region/statistics/years`);
        $scope.years = data;
        $scope.years.forEach((item) => item.toString = () => $scope.translate(item.name));

        $scope.filterChoiceCorrelation = {
            keys : ["docsType","reassorts","year", "schoolType", "schoolOrientation"],
            years : 'year',
            schoolType : 'public',
            docsType : 'catalog',
            reassorts : 'reassort',
            schoolOrientation: 'orientation'
        };


        this.init = async () => {
            // Init the stat for the current year and reassort as false
            let date;
            if(new Date().getMonth() > 4) {
                date = new Date().getFullYear() + 1;
                date = date.toString();
            } else {
                date = new Date().getFullYear().toString();
            }
            let filterYear = new Filter();
            filterYear.name = "year";
            filterYear.value = date;
            $scope.filters.all.push(filterYear);
            await $scope.stats.get($scope.filters);
            //await $scope.statsStructure.get($scope.filters);
            Utils.safeApply($scope);

            // Init filter as last year and reassort false
            $scope.filterChoice.years.push($scope.years[0]);
            Utils.safeApply($scope);
        };

        $scope.getPublicTotal = (field, publics) => {
            let total = 0;
            if(field.find(r => r.public === publics)) {
                total = field.find(r => r.public === publics).total;
            }
            return total;
        }

        $scope.getPublicPercentage = (field, publics) => {
            let total = 0;
            if(field.find(r => r.public === publics)) {
                total = field.find(r => r.public === publics).percentage;
            }
            return total;
        }

        $scope.isPublic = (publics) => {
            return !!$scope.filterChoice.schoolType.find(r => r.name === publics) || $scope.filterChoice.schoolType.length == 0;
        }

        $scope.getFilter = async () => {
            $scope.filters.all = [];
            for (const key of Object.keys($scope.filterChoice)) {
                $scope.filterChoice[key].forEach(item => {
                    let newFilter = new Filter();
                    newFilter.name = $scope.filterChoiceCorrelation[key];
                    newFilter.value = item.name;
                    $scope.filters.all.push(newFilter);
                });
                Utils.safeApply($scope);
            }
            await $scope.stats.get($scope.filters);
            Utils.safeApply($scope);
        }

        $scope.statsByStructures =  async () => {
            template.open('main-profile', 'administrator/management-main');
            await template.open('administrator-main', 'administrator/stats/view-stats-structures');
            Utils.safeApply($scope);
        }

        this.init();
        Utils.safeApply($scope);
    }
]);