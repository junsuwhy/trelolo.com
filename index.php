<?php

define('HOME_BOARD_ID','XAL44x7M');
define('HOME_BOARD_URI','/b/XAL44x7M');

global $page, $boardID, $cardID, $data, $apikey;
$page = new stdClass();

include_once('apikey.php');

main();


function main(){
  global $data, $page, $boardID, $cardID;
  $page->url = doRouter();
  $data = getJsonData($page->url);
  setPageVariables($data);

  $html = file_get_contents('./index.html');

  if($boardID !== HOME_BOARD_ID){
    $replace = array(
      '<title>Trelolo.com</title>' => "<title>{$page->title}</title>",
      '<meta name="description" content="Trelolo 是一個把你的 Trello 公開板轉成網站的服務">' => '<meta name="description" content="'.$page->title.'">',
      '<meta property="og:url" content="https://trelolo.com" />' => '<meta property="og:url" content="http://trelolo.com'.$page->url.'" />',
      '<meta property="og:title" content="Trelolo.com" />' => '<meta property="og:title" content="'.$page->title.'" />',
      '<meta property="og:description" content="Trelolo 是一個把你的 Trello 公開板轉成網站的服務" />' => '<meta property="og:description" content="'.$page->title.'" />',
      '<meta property="og:image"  content="https://trello-attachments.s3.amazonaws.com/59b540d5052fbb94cdffdb6c/59b540e1d39e13730087c785/e41981b38c7f06c0c5667c10bd5b16dc/images.jpg" />' => '<meta property="og:image"  content="'.$page->og_image.'" />',
    );
  }else{
    $replace = array(
      '<meta property="og:image"  content="https://trello-attachments.s3.amazonaws.com/59b540d5052fbb94cdffdb6c/59b540e1d39e13730087c785/e41981b38c7f06c0c5667c10bd5b16dc/images.jpg" />' => '<meta property="og:image"  content="'.$page->og_image.'" />',
    );
  }
  foreach ($replace as $key => $value) {
    $html = str_replace($key, $value, $html);
  }
  print($html);
}


function doRouter(){
  global $page;
  if(!empty($_GET)){
    foreach ($_GET as $key => $value) {
      if($key == 'q'){
        $q = $value;
      }elseif(preg_match('/^([bc])\/([^\/]+)/',$key)){
        $q = '/'.$key;
      }
    }
  }else{
    $q = HOME_BOARD_URI;
  }
  
  if(preg_match('/^\/([bc])\/([^\/]+)/',$q,$match_arr)){
    if($match_arr[1] == 'b'){
      global $boardID;
      $boardID = $match_arr[2];
    }
    if($match_arr[1] == 'c'){
      global $cardID;
      $cardID = $match_arr[2];
    } 
  }
  return $q;
}

function getJsonData($path){
  global $apikey;
  $url = "https://trello.com/{$path}.json?key={$apikey}";
  $json = file_get_contents($url);
  
  $data = json_decode($json);
  return $data;
}

function setPageVariables($data){
  global $page;
  $page->title = $data->name;
  if($data->prefs->backgroundImage){
    $page->og_image = $data->prefs->backgroundImage;
  }
}

?>
