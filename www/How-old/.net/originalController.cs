using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web.Mvc;
using BuildDemoSite;
using BuildDemoSite.Models;
using FaceSdk;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.WindowsAzure.IntelligentServices.Face.AlgorithmHelper;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web;
using Microsoft.Bond;
using Microsoft.WindowsAzure.ServiceRuntime;

namespace BuildDemo.Controllers
{
    public class HomeController : Controller
    {

        private const string TestCode = "480B1A6E-E541-4663-8B87-0224ECC2D5BD";

        public ActionResult Index(bool isTest = false)
        {
            
            return View("Index", new HomeModel {Precanned = MvcApplication.PrecannedOrdered, IsTest = isTest});
        }

        [HttpGet]
        public async Task<ActionResult> Test(string testCode)
        {
            if (testCode.ToUpperInvariant() != TestCode)
            {
                return new HttpUnauthorizedResult();
            }
            string requestId = Guid.NewGuid().ToString();
            
            string baseUrl = Request.Url.Scheme + System.Uri.SchemeDelimiter + Request.Url.Host +
                             (Request.Url.IsDefaultPort ? "" : ":" + Request.Url.Port);
            string id = RoleEnvironment.IsAvailable ? RoleEnvironment.CurrentRoleInstance.Id : "N/A";
            Stopwatch stopwatch = Stopwatch.StartNew();
            await MvcApplication.FaceClientDirect.AnalyzeByImageUrl(string.Format("{0}/Images/Faces2/main003.jpg", baseUrl));
            var latency = stopwatch.ElapsedMilliseconds;
            JObject jresponse = new JObject();
            jresponse["instance_id"] = id;
            jresponse["machine_name"] = Environment.MachineName;
            jresponse["latency"] = latency;
            jresponse["deployment_name"] = MvcApplication.DeploymentName;
            jresponse["requestId"] = requestId;
            string responseStr = JsonConvert.SerializeObject(jresponse);
            Telemetry.TraceInformation(string.Format("Test: {0}", responseStr), requestId);
            return Content(responseStr, "application/json");
        }

        [HttpPost]
        public async Task<ActionResult> Analyze(string faceUrl = null, string faceName = null, bool isTest = false)
        {
            string requestId = Guid.NewGuid().ToString();
            int? contentLength = null;
            try
            {
                Stopwatch stopwatch = Stopwatch.StartNew();
                //Trace.WriteLine(string.Format("Start Analyze Request: RequestId: {0};", requestId));
                ImageSubmissionMethod method;
                List<FaceModel> imageResult;
                if (Request.ContentType == null)
                {
                    return new HttpStatusCodeResult(HttpStatusCode.BadRequest, "BadRequest");
                    
                }
                if (string.Equals(Request.ContentType, "application/octet-stream"))
                {
                    contentLength = Request.ContentLength;
                    imageResult = MvcApplication.FaceClientDirect.AnalyzeByImageData(Request.InputStream);
                    method = ImageSubmissionMethod.Upload;

                }
                else if (!string.IsNullOrEmpty(faceName) &&
                     MvcApplication.PrecannedLookup.TryGetValue(faceName, out imageResult))
                {
                    method = ImageSubmissionMethod.FaceList;
                }
                else if (!string.IsNullOrEmpty(faceUrl) && faceUrl != "undefined")
                {
                    imageResult = await MvcApplication.FaceClientDirect.AnalyzeByImageUrl(faceUrl);
                    method = ImageSubmissionMethod.Search;
                }
                else if (Request.Files != null && Request.Files.Count > 0 && Request.Files[0] != null)
                {
                    contentLength = Request.ContentLength;
                    imageResult = MvcApplication.FaceClientDirect.AnalyzeByImageData(Request.Files[0].InputStream);
                    method = ImageSubmissionMethod.Upload;
                }
                else
                {
                    Telemetry.TrackWarning(
                        string.Format(
                            "Bad Request while Analyzing Image. faceUrl: {0}; faceName: {1}; isTest: {2}", faceUrl,
                            faceName, isTest), requestId);
                    return new HttpStatusCodeResult(HttpStatusCode.BadRequest, "BadRequest");
                }
                AnalyzeResultsModel model = new AnalyzeResultsModel();
                model.Faces = imageResult;
                long elapsed = stopwatch.ElapsedMilliseconds;
                List<AnalyticsEvent> analyticsEvent = MvcApplication.AnalyticsClient.SendEventAsync(model.Faces, method, Request, requestId, contentLength, elapsed, isTest);
                model.AnalyticsEvent = JsonConvert.SerializeObject(analyticsEvent, Formatting.Indented);

                //Trace.WriteLine(string.Format("Completed Analyze Request: RequestId: {0};", requestId));
                return Json(JsonConvert.SerializeObject(model), "application/json");
            }
            catch (Exception e)
            {
                Telemetry.TrackError(
                    string.Format(
                        "Error Analyzing Image. Error: {0}; faceUrl: {1}; faceName: {2}; isTest: {3}",
                        e.ToString(), faceUrl, faceName, isTest), requestId);
                return new HttpStatusCodeResult(HttpStatusCode.InternalServerError, "Error");
            }
        }


        [HttpPost]
        public async Task<ActionResult> BingImageSearch(string query)
        {
            string requestId = Guid.NewGuid().ToString();
            try
            {
                //Trace.WriteLine(string.Format("Start Search Request: RequestId: {0};", requestId));
                var results = await MvcApplication.ImageSearchClient.SearchImages(query);
                if (results == null || results.Length == 0)
                {
                    return HttpNotFound();
                }
                //Trace.WriteLine(string.Format("Completed Search Request: RequestId: {0};", requestId));
                return Json(JsonConvert.SerializeObject(results), "application/json");
            }
            catch (Exception e)
            {
                Telemetry.TrackError(string.Format("Error While Searching: {0}; Error:{1}", query, e.ToString()), requestId);
                return new HttpStatusCodeResult(HttpStatusCode.InternalServerError, "Error");
            }
        }
    }
}