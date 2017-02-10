## gen-optim

Given following `index.js`

```js
module.exports = async (ok) => {
  console.log(ok)
}
```

`async-to-gen` gives:

```js
module.exports = function (ok) {return __async(function*(){
    console.log(ok)
}())}

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a)}catch(e){j(e);return}r.done?s(r.value):Promise.resolve(r.value).then(c,d)}function d(e){c(e,1)}c()})}
```

Turns out the module from the compiled source is not v8 optimized

```js
const check = require('check-v8-optimised')
const fn = require('./index.compiled')
const result = check(fn, ['ok'])
console.log('RESULT', result)
// it prints 'Function is not optimized'
```

By using this module,

```js
const optimize = require('gen-optim')
const src = fs.readFileSync('./index.js', 'utf8')
const compiled = compile(src).toString()
const optimized = optimize(compiled).toString()

fs.writeFileSync('./index.optimized.js', optimized)

// check using check-v8-optimised
const check = require('check-v8-optimised')
const fn = require('./index.optimised')
const result = check(fn, ['ok'])
console.log('RESULT', result)
// it prints 'Function is optimized'
```

Yay!

## license

MIT

