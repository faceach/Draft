
var s = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="zh-CN"><mark name="TtsService"/><mstts:audiosegment data="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f+aoMeL89z6SL09VqTgaGIxvGu3aya/puQsf/D0DX99MzBtncEaxG2ovxIr8as6fm0vaeHZvWGfWs+JCuJqpzr7W1Cr5t7VOGEB/Z4UpuYFDkU1OyXrYcoiMFPQ9oM+X2fpd2fZCX0qOxHdol94UVYiTM6HglNDpYTYjcm8mJPmMqFoyl1/q1p6Kkx4bknc2MkQYJ25WOhgJ+yAYp9Vt9RoWFehAKw6byTFtlcvfwRY+5tOl9PxuSCrSuCPvinnRgnbhILRbu6jYMM+NMfFb8n3hSS15vK9A1r5hOVVE/4CpZkPHEP9jjYsh4w+HeRSpo/aXgq/cHHDvKgnGflMrW/i+yi199qyLbJ1GRW7KUfZ7AtiwC0+JxNtbwC8ZZVf8cntx1lyiT5ZpbScu+qWO/QjUarsaCTF8fnNCD+G3QjR4E/LfQoeKKU3gs6et+jKA53o9yadcXw1JrQSJOg7xTufTX0Z/btCvN0XO6t/2AV3U1lQS8JAVqN3icyL5epRBSZUZOQQw8TlKEnL+noMJrjWaNU3N1FZ0zM5mRpq7VlG9u1EdHSm2S0+gzP+RIp1eKwfduWesHOzkCg/H4W28k+nifL12jMLo+CvoHQMkTcUm18CSFW7q5/U8MkoSOw+JK/gZIxiWr5iE86hb982D8JOG8Ee8pAc0uf+WNmK3o0p41GPECDgI8ri8qAoqiZNVFS01fjmme1CUPDzy3Pcf1/e7We3JlySe1zA9j4SSn6WGveIutHV14z+CvmIZNdxZ3cve7e1D4WF9lYKDG5Xc+F79CRldbrdserR6vdMWeBzGQj938FDT3IYiljJhTKOgU3dI/5U8W6bAMELWE3SQebaEubzcNETukv5wlUTutli6hYqe2SxxknQfOU4JodUTOTwZmaMpFj0eJMX5b1Eyh7AXBP8U4VbSfLWF/Uhj06cDFluM/eJUtk8CxCmSjH46Ks9wa2uG4EAg19IXU1DwCd41WPkHlfaJ9VijveDrg+55tnzU9YB/fekMUfdCRCFFPfUI7H/79seR12CZ9nLdMt369F3OBd+CUo7LlJWd6NoC74Idq8b8MxcEI3Ino71wBmMd1XqcDFWKDcQdT3/lRZ2lJZSiT5hgpcglhaDDlX5gEnWC/6wplZXMjNYqNgRlumBEHAglhBA7QlSMRQe/qykrd0vTeMnMhKLgXT+c3VFKaFa8NCY2o/2jqbT2PiyyZdIWm90RMo19wF6cDJNXaR+pGUgCrXIiMHn7cOwVD118/nMA3q5Ypy4z275kMnHIy0XNwapAfeuRpyt09eQ/R9ix5NanK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/pyt09eMkn410Lv+nK3T14ySfjXQu/6crdPXjJJ+NdC7/">今天多云，最高29度，最低22度，风力3级，当前空气质量良。</mstts:audiosegment></speak>';

CortanaApp.speak(s)

-----------------------------------------------------

CortanaApp.spaDialogRuntime.speakAsync(s).then(() => {console.log("HELLO")})

CortanaApp.triggerCortanaEventListenerFromNative('callNativeAsync_speakSync','{"status":"resolved"}')

-----------------------------------------------------

CortanaApp.spaDialogRuntime.addEventListener('abcde', function(){console.log('=== abcde ===')})

CortanaApp.triggerCortanaEventListenerFromNative('abcde')