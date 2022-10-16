const {axios} = require('./altel_axios.cjs');
const {hex_md5} = require('./altel_md5.cjs');


/*
 *Login Variables
 */
let AuthQop,username="",passwd="",GnCount=1,Authrealm,Gnonce,nonce, vSetCookie;


/*
 * Check the login responce as the 200 OK or not.
 */
function hasLoginSucceded(urlData) {
	if (urlData){
		const res = urlData.split(",");
		let status = res[0];
		status = status.split("=")[1];
		if(status  == 0 ) {
			return "success";
		}
		if(status == "5"){
			const left_time = res[1].split("=")[1];
			const left_times = 5-status;
			return left_times+";"+left_time;
		}else{
			const left_times = 5-status;
			return left_times;
		}
	}
}

function getValue(authstr) {
    const arr=authstr.split("=");
    return arr[1].substring(1,arr[1].indexOf('\"',2) );
}

async function doLogin(username1,passwd1) {
    const authResp1 = await axios.get( "/login.cgi",
    {headers:{
          "Expires": "-1",
          "Cache-Control":["no-store, no-cache, must-revalidate"],
          "Pragma": "no-cache"
      },withCredentials: true}
    );
    const loginParam =  authResp1.headers['www-authenticate'];

    if(loginParam!=null) {
        let loginParamArray = loginParam.split(" ");
        if(loginParamArray[0] =="Digest") {
            Authrealm = getValue(loginParamArray[1]);
            nonce = getValue(loginParamArray[2]);
            AuthQop = getValue(loginParamArray[3]);

            username = username1;
            passwd = passwd1;
            let rand, date, salt, strResponse;

            Gnonce = nonce;
            let tmp, DigestRes;
            let HA1, HA2;

            HA1 = hex_md5(username+ ":" + Authrealm + ":" + passwd);
            HA2 = hex_md5("GET" + ":" + "/cgi/xml_action.cgi");

            rand = Math.floor(Math.random()*100001)
                   date = new Date().getTime();

            salt = rand+""+date;
            tmp = hex_md5(salt);
            AuthCnonce = tmp.substring(0,16);


            let strhex = hex(GnCount);
            let temp = "0000000000" + strhex;
            let  Authcount = temp.substring(temp.length-8);
            DigestRes = hex_md5(HA1 + ":" + nonce + ":" + Authcount + ":" + AuthCnonce + ":" + AuthQop + ":" + HA2);

            const url2 =  "/login.cgi?Action=Digest&username="+username+"&realm="+Authrealm+"&nonce="+nonce+"&response="+DigestRes+"&qop="+AuthQop+"&cnonce="+AuthCnonce + "&nc="+Authcount+"&temp=marvell";
            const authHeader = getAuthHeader("GET");
            const authResp0 = await axios.post(
                url2,
                null, // body
                {headers:{
                        "Authorization": authHeader,
                        "Expires": "-1",
                        "Cache-Control":["no-store, no-cache, must-revalidate"],
                        "Pragma":"no-cache",
                  },withCredentials: true}
            );
            const authResp = authResp0.headers['www-authenticate'];
            vSetCookie = authResp0.headers['set-cookie']


            let res = hasLoginSucceded(authResp);
            if(res == "success") {
                strResponse = "Digest username=\"" + username + "\", realm=\"" + Authrealm + "\", nonce=\"" + nonce + "\", uri=\"" + "/cgi/protected.cgi" + "\", response=\"" + DigestRes + "\", qop=" + AuthQop + ", nc=00000001" + ", cnonce=\"" + AuthCnonce + "\"" ;
                return res;
            } else {
                return res;
            }
            return strResponse;
        }
    }
    return -1;
}

function getAuthHeader(requestType,file) {
    let rand, date, salt, strAuthHeader;
    let  tmp, DigestRes,AuthCnonce_f;
    let HA1, HA2;

    HA1 = hex_md5(username+ ":" + Authrealm + ":" + passwd);
    HA2 = hex_md5( requestType + ":" + "/cgi/xml_action.cgi");

    rand = Math.floor(Math.random()*100001)
    date = new Date().getTime();

    salt = rand+""+date;
    tmp = hex_md5(salt);
    AuthCnonce_f = tmp.substring(0,16);

    let strhex = hex(GnCount);
    let temp = "0000000000" + strhex;
    let  Authcount = temp.substring(temp.length-8);
    DigestRes =hex_md5(HA1 + ":" + nonce + ":" + Authcount + ":" + AuthCnonce_f  + ":" + AuthQop + ":"+ HA2);

    GnCount++;
    strAuthHeader = "Digest " + "username=\"" + username + "\", realm=\"" + Authrealm + "\", nonce=\"" + nonce + "\", uri=\"" + "/cgi/xml_action.cgi" + "\", response=\"" + DigestRes + "\", qop=" + AuthQop + ", nc=" + Authcount + ", cnonce=\"" + AuthCnonce_f  + "\"" ;
    DigestHeader = strAuthHeader ;
    return strAuthHeader;
}

async function logOut() {
  await axios.get( "/"+'xml_action.cgi?Action=logout', {withCredentials: true});
}

function hex(d) {
    const hD="0123456789ABCDEF";
    let h = hD.substr(d&15,1);
    while(d>15) {
        d>>=4;
        h=hD.substr(d&15,1)+h;
    }
    return h;

}


// /**
//  *
//  * @param objPath :  path
//  * @param objMethod : method
//  * @param controlMap :  parameter
//  * @param type:   default: manual, 'clearInterval' : auto
//  * @param wait
//  * @returns
//  */
async function PostXml(objPath, objMethod,controlMap,type) {
    const xmlBodyStr ="<?xml version=\"1.0\" encoding=\"US-ASCII\"?> <RGW><param><method>call</method><session>000</session><obj_path>cm</obj_path><obj_method>get_eng_info</obj_method></param></RGW>";
    const url = "/xml_action.cgi?method=set";

    const xxxr = await axios.post(url, xmlBodyStr, {headers:{
            "Authorization":getAuthHeader("POST"),
			"csrftoken": "hfiehifejfklihefiuehflejhfueihfeuihfeui",
            'cookie': vSetCookie,
            // "cookie": "username=YWRtaW4=; password=TG9AMTIxMzUx; CGISID=LAF3XoMS3HpvfnaxhmaCWUFLYudAObbqDIsy7fi1ZGv4V; projectConfig=%5Bobject%20Object%5D",
        },withCredentials: true});
    const xxxr_data = xxxr.data;
    // console.log(xxxr_data)
    return xxxr;
    //
    // );
    // $.ajax( {
    // data: xmlData,
    // async: false,
    // dataType: "xml",
    // timeout: 360000,
    // success:function(data, textStatus) {
    //         let err = $(data).find("error_cause").text();
    //         let errmsg;
    //         if("2" == err) {
    //             errmsg = " Param error of XML";
    //             alert(errmsg);
    //         }else if("4" == err) {
    //             errmsg = " MethodName:" + controlMap.get("RGW/param/obj_method");
    //             alert(errmsg);
    //         }else if(5 == err){
	// 			clearAuthheader();
	// 		}
    //     },
    // complete:function(XMLHttpRequest, textStatus) {
    //         if(200 != XMLHttpRequest.status) {
    //         } else {
    //             xmlDoc = XMLHttpRequest.responseXML || XMLHttpRequest.responseText;
    //         }
    //     },
    // error: function(XMLHttpRequest, textStatus, errorThrown) {
    //     }
    // });
    // return xmlDoc;
}

module.exports = {doLogin, getAuthHeader, PostXml};