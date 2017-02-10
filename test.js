/* eslint-disable no-eval */
const check = require('check-v8-optimised')
const compile = require('async-to-gen')
const optimize = require('./')
const test = require('tape')
const fs = require('fs')

test('optimized class', (t) => {
  t.plan(1)
  const src = fs.readFileSync('./files/class.js', 'utf8')
  const compiled = compile(src).toString()
  const optimized = optimize(compiled).toString()

  fs.writeFileSync('./files/class.compiled.js', optimized)
  const CompiledClass = require('./files/class.compiled')
  const compiledInstance = new CompiledClass()
  console.log(compiledInstance)
  compiledInstance.say('ok')
    .then((ok) => {
      t.equal(ok, 'ok')
    })
  // not sure how to check the optimization
})

test('optimized function', (t) => {
  t.plan(2)

  const src = fs.readFileSync('./files/fn.js', 'utf8')
  const compiled = compile(src).toString()
  const optimized = optimize(compiled).toString()

  fs.writeFileSync('./files/fn.compiled.js', compiled)
  fs.writeFileSync('./files/fn.optimized.js', optimized)

  const compiledFn = require('./files/fn.compiled')
  const optimizedFn = require('./files/fn.optimized')

  let checked = ''
  checked = check(compiledFn, ['ok'])
  t.equal(checked, 'Function is not optimized')
  checked = check(optimizedFn, ['ok'])
  t.equal(checked, 'Function is optimized')
})

test('arrow function', (t) => {
  t.plan(2)

  const src = fs.readFileSync('./files/arrow.js', 'utf8')
  const compiled = compile(src).toString()
  const optimized = optimize(compiled).toString()

  fs.writeFileSync('./files/arrow.compiled.js', compiled)
  fs.writeFileSync('./files/arrow.optimized.js', optimized)

  const compiledArrow = require('./files/arrow.compiled')
  const optimizedArrow = require('./files/arrow.optimized')

  let checked = ''
  checked = check(compiledArrow, ['ok'])
  t.equal(checked, 'Function is not optimized')
  checked = check(optimizedArrow, ['ok'])
  t.equal(checked, 'Function is optimized')
})
