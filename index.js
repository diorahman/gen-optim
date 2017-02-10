var babylon = require('babylon')
var MagicString = require('magic-string')
var index = 0

module.exports = run

function register (editor, node, gen, params, isMember) {
  isMember = isMember === true
  var callee = gen.callee
  if (gen.callee.type === 'MemberExpression') {
    callee = gen.callee.object
  }
  if (callee.type === 'FunctionExpression' &&
      callee.body.type === 'BlockStatement') {
    var fnName = '' + index++
    var body = editor.slice(callee.body.start, callee.body.end)
    var prefix = isMember ? '__' : '\nfunction* __'
    var decorator = isMember ? '* ' : ''
    var fn = '\n' + decorator + prefix + fnName + '(' + params.join(',') + ')' + body
    var owner = isMember ? 'this.' : ''
    editor.overwrite(gen.start, gen.end, owner + '__' + fnName + '(' + params.join(',') + ')')
    editor.appendRight(node.end, fn)
  }
}

function enterArrowFunction (editor, node, ast) {
}

function leaveArrowFunction (editor, node, ast) {
  if (node.body && node.body.type === 'CallExpression') {
    // FIXME: check for __asyncGen
    if (node.body.callee.name === '__async') {
      var params = node.params.map((param) => { return param.name })
      var callGen = node.body.arguments.pop()
      register(editor, node, callGen, params)
    }
  }
}

function enterFunctionExpression (editor, node, ast) {
}

function leaveFunctionExpression (editor, node, ast, isMember) {
  if (node.body && node.body.type === 'BlockStatement') {
    var callRet = node.body.body
    if (Array.isArray(callRet) && callRet[0] && callRet[0].type === 'ReturnStatement') {
      if (callRet[0].argument.type === 'CallExpression' && callRet[0].argument.callee.name === '__async') {
        // FIXME: create a common function
        var params = node.params.map((param) => { return param.name })
        var callGen = callRet[0].argument.arguments.pop()
        register(editor, node, callGen, params, isMember)
      }
    }
  }
}

function leaveClassMethod (editor, node, ast) {
  if (Array.isArray(node.body.body) && node.body.body[0]) {
    leaveFunctionExpression(editor, node, ast, true)
  }
}

function leaveMemberExpression (editor, node, ast) {
}

var visitor = {
  ArrowFunctionExpression: {
    enter: enterArrowFunction,
    leave: leaveArrowFunction
  },
  FunctionExpression: {
    enter: enterFunctionExpression,
    leave: leaveFunctionExpression
  },
  MemberExpression: {
    leave: leaveMemberExpression
  },
  ClassMethod: {
    leave: leaveClassMethod
  }
}

function visit (ast, editor, visitor) {
  var stack
  var node
  var visitFn
  var parent = ast
  var keys = ['program']
  var index = -1

  do {
    index++
    if (stack && index === keys.length) {
      parent = stack.parent
      keys = stack.keys
      index = stack.index
      node = parent[keys[index]]
      if (node.type) {
        visitFn = visitor[node.type] && visitor[node.type].leave
        visitFn && visitFn(editor, node, ast, stack)
      }
      stack = stack.prev
    } else {
      node = parent[keys[index]]
      if (node && typeof node === 'object' && (node.type || node.length)) {
        stack = {parent: parent, keys: keys, index: index, prev: stack}
        parent = node
        keys = Object.keys(node)
        index = -1
        if (node.type) {
          visitFn = visitor[node.type] && visitor[node.type].enter
          visitFn && visitFn(editor, node, ast, stack)
        }
      }
    }
  } while (stack)
}

// src in string
function run (src) {
  var editor = new MagicString(src)
  editor.isEdited = false

  var ast = babylon.parse(src, {
    sourceType: 'module'
  })

  visit(ast, editor, visitor)

  return String(editor)
}
