# jQueue
> Control Concurrency of Asynchronous Functions

## Usage
```javascript
const JQueue = require('jqueue');

const jQueue = new JQueue({ capicity: 3, });

const startTime = Date.now();

const process = (arg) => new Promise(resolve => {
  setTimeout(() => { 
    console.log(`arg: ${arg} | time: ${(Date.now() - startTime) / 1000}`);
    resolve(null);
  }, 1000);
});

for (let i = 0; i < 10; i++) {
 jQueue.run(() => process(i));
}
```

The result will be like:
```
arg: 0 | time: 1.003
arg: 1 | time: 1.018
arg: 2 | time: 1.019
arg: 3 | time: 2.022
arg: 4 | time: 2.023
arg: 5 | time: 2.023
arg: 6 | time: 3.024
arg: 7 | time: 3.025
arg: 8 | time: 3.025
arg: 9 | time: 4.029
```
As shown, asynchronous functions will be run concurrently according to the assigned **capacity** value :）

## API
### Parameters
```javascript
const jQueue = new JQueue({
  capacity: 1,
  buildInstance: () => null,
  destoryInstance: (instance) => null,
})
```
#### **capacity**
  + number 
  + optional
  + Default Value: 1

  The maximum concurrency number of each loop.

#### **buildInstance**
  + () => any | Promise&lt;any&gt;
  + optional
  + Default Value: () => null
  
If you want to reuse some instances in follow-up loops, you can provide a method to build these instances (We ensure the count will NOT be greater than the value of **capacity**).

#### **destoryInstance**
  + (instance: any) => void
  + optional
  + Default Value: () => null
  
When functions are fewer than instances, instances will be deleted after the function, which means the parameter provide a method to tear down a instance if necessary.

### Method
```javascript
jQueue.run(async (instance) => {
  return 'anything';
})
.then((res) => console.log(res)); // anything
```
#### **run**
The method receives a async function and give the instance created by **buildInstance** as the argument. Besides, the result will be the same as the original function. Shortly, it can be regarded as a decorator of the function.