showdown.setOption('simplifiedAutoLink',true);
showdown.setOption('openLinksInNewWindow',true);
showdown.setOption('simpleLineBreaks',true);
showdown.setOption('headerLevelStart',2);
showdown.setOption('tables',true);
showdown.setOption('parseImgDimensions',true);
showdown.setOption('disableForced4SpacesIndentedSublists',true);



var treloloBoardID = 'XAL44x7M';
        
var app = angular.module("page", ['ngSanitize']).config(function($sceDelegateProvider) {  
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain. **.
        'https://trello.com/**'
      ]);
}).config(function($locationProvider) {
    $locationProvider.html5Mode({ enabled: true, requireBase: false, rewriteLinks: false });
});

app.controller('MgCtrl',['$scope','$http','$sce',function($scope, $http, $sce){
    
    doRouter = function($scope){
        if(typeof window.cardID != 'undefined'){
            $scope.cardID = cardID;
            if( !$scope.myData ){
                $scope.jsonUrl ='https://trello.com/c/'+$scope.cardID+'.json';
                doUpdateFromCardJson();
                return;
            }
            // setContent($scope);
        }
        else if(typeof window.boardID != 'undefined'){
            $scope.boardID = boardID;
        }else{
            $scope.boardID = treloloBoardID;
        }
        if($scope.boardID == treloloBoardID){
            $scope.isTreloloDotCom = true;
        }

        if( !$scope.myData ){
            $scope.jsonUrl ='https://trello.com/b/'+$scope.boardID+'.json';
            doUpdateFromBoardJson();
            return;
        }

            // if( !$scope.myData ){
            //     $scope.jsonUrl ='https://trello.com/c/'+$scope.cardID+'.json';
            //     doUpdateFromCardJson();
            //     return;
            // }
            // setContent($scope);
    }
    
    setHeader = function($scope){
        if($scope.myData.prefs.backgroundImage){
            if(window.outerWidth > 960){
                $scope.bgImage = $scope.myData.prefs.backgroundImage;
            }else{
                var backgroundImageScaled = $scope.myData.prefs.backgroundImageScaled;
                for(var i=0;i< backgroundImageScaled.length;i++){
                    $scope.bgImage = backgroundImageScaled[i].url;
                    if(backgroundImageScaled[i].width > window.innerWidth)break;
                }
            }
        }else{
            $scope.bgColor = $scope.myData.prefs.backgroundColor;
        }
        if($scope.myData.prefs.backgroundBrightness == 'dark'){
            $scope.bgTextColor = 'white';
        }else{
            $scope.bgTextColor = 'black';
        }
        
        // Dynamic add script, style files to variable. Add to page on doAddSourceDynamicly function.
        $scope.scripts = [];
        $scope.styles = [];
        if($scope.myData.cards.length > 0){
            $scope.myData.cards[0].attachments.forEach(function(file){
                regjs = RegExp(/\.js\??/);
                regcss = RegExp(/\.css\??/);
                if(regjs.exec(file.url)){
                    $scope.scripts.push(file.url);
                }
                if(regcss.exec(file.url)){
                    $scope.styles.push(file.url);
                }
            })
        }
        doAddSourceDynamicly($scope);
    }
    
    setMenu = function($scope){
        var menu = [];
        var lists = $scope.myData.lists;
        lists.forEach(function(item){
            if(!item.closed){
                var object = {
                    title : item.name,
                    id : item.id,
                    children : [],
                }
                menu.push(object);   
            }
        });
        
        $scope.menu = menu;
        
        $scope.myData.cards.forEach(function(item){
            if(!item.closed){
                if(!$scope.homeCardId){
                    $scope.homeCardId = item.shortLink;
                }
                parent = getMenuParent($scope, item.idList);
                if(parent){
                    if(!item.desc){
                        var url = "#";
                    }else{
                        var reg = RegExp(/^http(s)?:\/\/[^\n]+$/);
                        if(reg.exec(item.desc)){
                            var url = item.desc;
                        }else{
                            var url = '/c/'+item.shortLink;    
                        }
                    }
                    if(parent.children.length == 0 && !parent.url){
                        if(parent.title == item.name){
                            parent.url = url;
                        }else{
                            parent.url = '#';
                        }
                    }
                    if(parent.children.length != 0 || parent.title != item.name){
                        parent.children.push({
                            title : item.name,
                            url : url,
                            shortLink : item.shortLink,
                        });
                    }
                }
            }
        });
        
        if(typeof postSetMenu != 'undefined'){
            postSetMenu();
        }
    }
    
    setContent = function($scope){
        $scope.isHome = false;
        if(!$scope.cardID){
            $scope.cardID = $scope.homeCardId;
            $scope.isHome = true;
        }
        else if($scope.cardID == $scope.homeCardId){
            $scope.isHome = true;
        }
        var cards = $scope.myData.cards.forEach(function(item){
            if(item.shortLink == $scope.cardID){
                $scope.title = item.name;
                var converter = new showdown.Converter();
                $scope.content = converter.makeHtml(item.desc);
                $scope.content = $sce.trustAsHtml($scope.content);
            }
        });
        document.title = $scope.title + ' | ' + $scope.myData.name;
        ga('set', 'page', location.search);
        ga('send', 'pageview');
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
    
    doUpdateFromCardJson = function(){
        var jsonUrl = $scope.jsonUrl;
        $http.get(jsonUrl)
        .then(function(response){
            $scope.boardID = response.data.actions[0].data.board.shortLink;
            $scope.jsonUrl = 'https://trello.com/b/'+$scope.boardID+'.json';
            doUpdateFromBoardJson();
        });
    }
    
    doUpdateFromBoardJson = function(){
        var jsonUrl = $scope.jsonUrl;
        $http.get(jsonUrl)
        .then(function(response){
            $scope.myData = response.data;
            setHeader($scope);
            setMenu($scope);
            setContent($scope);
        });
    }

    doAddSourceDynamicly = function($scope){

        // part inspired by https://stackoverflow.com/questions/15939913/single-page-application-load-js-file-dynamically-based-on-partial-view
        if($scope.scripts.length > 0){
            var head = document.getElementsByTagName('head')[0];
            $scope.scripts.forEach(function(path){
                script = document.createElement('script');
                script.setAttribute('src', path);
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('charset', 'utf-8');
                head.appendChild(script);
            });
        }

        if($scope.styles.length > 0){
            var head = document.getElementsByTagName('head')[0];
            $scope.styles.forEach(function(path){
                var link = document.createElement('link');
                link.setAttribute('rel', 'stylesheet');
                link.setAttribute('type', 'text/css');
                link.setAttribute('href', path);
                head.appendChild(link);
            });
        }
    }
    
    $scope.changeContent = function changeContent($event){
        var obj = $event.target;
        var href = obj.getAttribute('href');
        if(href == '#'){
            return
        }else{
            history.pushState(null,'',href);
            var reg = RegExp(/^\/([bc]+)\/([^\/]+)(?:\/([^\/]+))?/);
            $event.preventDefault();
            if(reg.exec(href)){
                $scope.cardID = reg.exec(href)[2];
                setContent($scope);
                $event.preventDefault();
            }
        }
    }

    $scope.doTransUrlToTrelolo = function(){
        var reg = RegExp(/^https:\/\/trello\.com\/([bc]\/[^\/]+)/);
        var regResult = reg.exec(this.urlFromTrello);
        if(regResult){
            this.urlToTrelolo = 'http://trelolo.com/'+regResult[1];
            ga('send','event','generator','success',this.urlToTrelolo);
        }else{
            var reg_2 = RegExp(/trello\.com/);
            if(reg_2.exec(this.urlFromTrello)){
                ga('send','event','generator','failed',this.urlToTrelolo);      
            }
        }
    }

    $scope.doCopyText = function(){
        // copy by https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
        var copyTextarea = document.querySelector('.url-to-trelolo');
          copyTextarea.select();

          try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
          } catch (err) {
            console.log('Oops, unable to copy');
          }
    }

    init = function(){
        doRouter($scope);
        doUpdateFromBoardJson();
        $scope.doTransUrlToTrelolo();
    }

    init();
}]);

// https://codepen.io/MicoTheArtist/pen/gbDlj
// https://stackoverflow.com/questions/30689040/angular-scroll-directive
// https://stackoverflow.com/questions/26588300/scroll-event-in-angularjs
app.directive("scroll", function ($window) {
    return function(scope, element, attrs) {
      scope.header_bg_top = -20/3;
      
        angular.element($window).bind("scroll", function() {
            scope.header_bg_top = (this.pageYOffset-20)/3;
            scope.$apply();
        });
    };
});