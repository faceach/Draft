using HowOldProxy.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web;
using System.Web.Http;

namespace HowOldProxy.Controllers
{
    public class ProxyController : ApiController
    {
        private byte[] mDummyBytes = Encoding.ASCII.GetBytes("[object Object]");

        [HttpGet]
        public HttpResponseMessage Index()
        {
            HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.Moved);
            response.Headers.Location = new Uri("http://howoldtest.chinacloudsites.cn/Default.htm");
            return response;
        }

        [HttpPost]
        public HttpResponseMessage Analyze([NakedBody] byte[] imageBytes)
        {
            byte[] dataBytes = mDummyBytes;
            Boolean useDummy = false;

            var queryString = Request.RequestUri.ParseQueryString();
            String faceUrl = queryString["faceUrl"];
            String faceName = queryString["faceName"];

            String url = "http://how-old.net/Home/Analyze?isTest=False";
            if (!String.IsNullOrEmpty(faceUrl))
            {
                url = url + "&faceUrl=" + faceUrl;
                useDummy = true;
            }

            if (!String.IsNullOrEmpty(faceName))
            {
                url = url + "&faceName=" + faceName;
                useDummy = true;
            }

            if (!useDummy)
            {
                dataBytes = imageBytes;
            }

            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "POST";
            request.ContentType = useDummy ? "text/plain;charset=UTF-8" : "application/octet-stream";
            request.ContentLength = dataBytes.Length;

            using (var stream = request.GetRequestStream())
            {
                stream.Write(dataBytes, 0, dataBytes.Length);
            }

            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            String responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();

            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            result.Content = new StringContent(responseString);
            result.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            return result;
        }

        [HttpPost]
        public HttpResponseMessage ImageSearch([NakedBody] byte[] queryBytes)
        {
            String query = System.Text.Encoding.UTF8.GetString(queryBytes);
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create("http://how-old.net/Home/BingImageSearch?query=" + query);
            request.Method = "POST";
            request.ContentType = "text/plain;charset=UTF-8";

            request.ContentLength = mDummyBytes.Length;
            using (var stream = request.GetRequestStream())
            {
                stream.Write(mDummyBytes, 0, mDummyBytes.Length);
            }

            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            String responseString = new StreamReader(response.GetResponseStream()).ReadToEnd();

            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            result.Content = new StringContent(responseString);
            result.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            return result;
        }
    }
}
