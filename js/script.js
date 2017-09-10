showdown.setOption('simplifiedAutoLink',true);

var app = angular.module("page", ['ngSanitize']).config(function($sceDelegateProvider) {  
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain. **.
        'https://trello.com/**'
      ]);
});
app.controller('MgCtrl',['$scope','$http','$sce',function($scope, $http, $sce){
    init = function(){
        doRouter($scope);
        
        var jsonUrl = $scope.jsonUrl;
        
        $http.get(jsonUrl)
            .then(function(response){
                console.log(response.data);
                $scope.myData = response.data;
                console.log($scope.myData);
                setMenu($scope);
                setContent($scope);
            });        
    }
    
    doRouter = function($scope){
        if(!location.search){
            search = '?XAL44x7M';
        }else{
            search = location.search;
        }
        var reg = RegExp(/\?([^\/]+)(\/([^\/]+))?/);;
        var router = reg.exec(search);
        if(router){
            $scope.boardID = router[1];
            console.log(router[3]);
            if(router[3]){
                $scope.cardID = router[3];    
            }
            $scope.jsonUrl ='https://trello.com/b/'+$scope.boardID+'.json';
        }
    }
    
    setMenu = function($scope){
        var menu = [];
        var lists = $scope.myData.lists;
        lists.forEach(function(item){
            var object = {
                title : item.name,
                id : item.id,
                children : [],
            }
            menu.push(object);
        });
        
        $scope.menu = menu;
        
        var cards = $scope.myData.cards.forEach(function(item){
            parent = getMenuParent($scope, item.idList);
            parent.children.push({
                title : item.name,
                url : '/index.html?'+$scope.boardID +'/'+item.shortLink,
                shortLink : item.shorLink
            });
        });
        
        if(typeof postSetMenu != 'undefined'){
            postSetMenu();
        }
    }
    
    setContent = function($scope){
        if(!$scope.cardID){
            $scope.cardID = $scope.myData.cards[0].shortLink;
        }
        var cards = $scope.myData.cards.forEach(function(item){
            if(item.shortLink == $scope.cardID){
                $scope.title = item.name;
                var converter = new showdown.Converter();
                $scope.content = converter.makeHtml(item.desc);
                $sce.trustAsHtml($scope.content);
                $scope.content = $sce.getTrustedHtml($scope.content);
            }
        }); 
    };
    
    getMenuParent = function($scope, menuID){
        var returnObj = null;
        $scope.menu.forEach(function(parent){
            if(parent.id.match(menuID)){
                returnObj = parent;
            }
        });
        return returnObj;
    };
    
    init();
    
    $scope.changeContent = function changeContent($event){
        $event.preventDefault();
        var obj = $event.target;
        $scope.cardID = obj.getAttribute('href').match(/\?(.+)\/(.+)/)[2];
        setContent($scope);
//        $event.preventEvent();
    }
}]);