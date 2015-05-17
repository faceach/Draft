using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BuildDemoSite
{
    public class ImageSearchClient
    {
        private readonly string _baseEndpoint;
        
        public ImageSearchClient(string baseEndpoint)
        {
            _baseEndpoint = baseEndpoint;
        }

        public async Task<BingSearchResult[]> SearchImages(string searchTerm)
        {
            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(5);
                client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("IIMLBuildDemo", "1"));
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                // new bing api
                var result =
                    await
                        client.GetAsync(string.Format("{0}&q={1}", _baseEndpoint, HttpUtility.UrlEncode(searchTerm)));
                result.EnsureSuccessStatusCode();
                var json = await result.Content.ReadAsStringAsync();
                dynamic data = JObject.Parse(json);
                if (data.answerResponses != null && data.answerResponses.Count > 0 &&
                    data.answerResponses[0].images.Count > 0)
                {
                    var elemsList = data.answerResponses[0].images;
                    var elemCount = Math.Min(40, elemsList.Count);
                    var response = new BingSearchResult[elemCount];
                    int evenCounter = (int)Math.Ceiling(elemCount/2.0) - 1;
                    int oddCounter = evenCounter + 1;
                    for (int i = 0; i < elemCount; i++)
                    {
                        var thumbUrl = (string) elemsList[i].thumbnailUrl.value;
                        var url1 = thumbUrl.Replace("w=160&h=160&c=7&pid=Api", "w=200&h=205&c=7&pid=Api");
                        var url2 = thumbUrl.Replace("w=160&h=160&c=7&pid=Api", "pid=Api");
                        var resElem = new BingSearchResult {ScrollImageUrl = url1, MainImageUrl = url2};
                        if (i%2 == 0)
                        {
                            //even
                            response[evenCounter] = resElem;
                            evenCounter--;
                        }
                        else
                        {
                            //odd
                            response[oddCounter] = resElem;
                            oddCounter++;
                        }
                    }
                    return response;
                }
                return null;
            }
        }
    }

    public class BingSearchResult
    {
        [JsonProperty("scroll_image_url")]
        public string ScrollImageUrl { get; set; }

        [JsonProperty("main_image_url")]
        public string MainImageUrl { get; set; }
    }
}
