var documenterSearchIndex = {"docs":
[{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"EditURL = \"https://github.com/jw3126/Setfield.jl/blob/master/examples/custom_macros.jl\"","category":"page"},{"location":"examples/custom_macros/#Extending-@set-and-@lens-1","page":"Custom Macros","title":"Extending @set and @lens","text":"","category":"section"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"This code demonstrates how to extend the @set and @lens mechanism with custom lenses. As a demo, we want to implement @mylens! and @myset!, which work much like @lens and @set, but mutate objects instead of returning modified copies.","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"using Setfield\nusing Setfield: IndexLens, PropertyLens, ComposedLens\n\nstruct Lens!{L <:Lens} <: Lens\n    pure::L\nend\n\nSetfield.get(o, l::Lens!) = Setfield.get(o, l.pure)\nfunction Setfield.set(o, l::Lens!{<: ComposedLens}, val)\n    o_inner = get(o, l.pure.outer)\n    set(o_inner, Lens!(l.pure.inner), val)\nend\nfunction Setfield.set(o, l::Lens!{PropertyLens{prop}}, val) where {prop}\n    setproperty!(o, prop, val)\n    o\nend\nfunction Setfield.set(o, l::Lens!{<:IndexLens}, val) where {prop}\n    o[l.pure.indices...] = val\n    o\nend","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"Now this implements the kind of lens the new macros should use. Of course there are more variants like Lens!(<:DynamicIndexLens), for which we might want to overload set, but lets ignore that. Instead we want to check, that everything works so far:","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"using Test\nmutable struct M\n    a\n    b\nend\n\no = M(1,2)\nl = Lens!(@lens _.b)\nset(o, l, 20)\n@test o.b == 20\n\nl = Lens!(@lens _.foo[1])\no = (foo=[1,2,3], bar=:bar)\nset(o, l, 100)\n@test o == (foo=[100,2,3], bar=:bar)","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"Now we can implement the syntax macros","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"using Setfield: setmacro, lensmacro\n\nmacro myset!(ex)\n    setmacro(Lens!, ex)\nend\n\nmacro mylens!(ex)\n    lensmacro(Lens!, ex)\nend\n\no = M(1,2)\n@myset! o.a = :hi\n@myset! o.b += 98\n@test o.a == :hi\n@test o.b == 100\n\ndeep = [[[[1]]]]\n@myset! deep[1][1][1][1] = 2\n@test deep[1][1][1][1] === 2\n\nl = @mylens! _.foo[1]\no = (foo=[1,2,3], bar=:bar)\nset(o, l, 100)\n@test o == (foo=[100,2,3], bar=:bar)","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"Everything works, we can do arbitrary nesting and also use += syntax etc.","category":"page"},{"location":"examples/custom_macros/#","page":"Custom Macros","title":"Custom Macros","text":"This page was generated using Literate.jl.","category":"page"},{"location":"intro/#Usage-1","page":"Introduction","title":"Usage","text":"","category":"section"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"Say we have a deeply nested struct:","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"julia> using StaticArrays;\n\njulia> struct Person\n           name::Symbol\n           age::Int\n       end;\n\njulia> struct SpaceShip\n           captain::Person\n           velocity::SVector{3, Float64}\n           position::SVector{3, Float64}\n       end;\n\njulia> s = SpaceShip(Person(:julia, 2009), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0])\nSpaceShip(Person(:julia, 2009), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0])","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"Lets update the captains name:","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"julia> s.captain.name = :JULIA\nERROR: type Person is immutable","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"It's a bit cryptic but what it means that Julia tried very hard to set the field but gave it up since the struct is immutable.  So we have to do:","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"julia> SpaceShip(Person(:JULIA, s.captain.age), s.velocity, s.position)\nSpaceShip(Person(:JULIA, 2009), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0])","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"This is messy and things get worse, if the structs are bigger. Setfields to the rescue!","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"julia> using Setfield\n\njulia> s = @set s.captain.name = :JULIA\nSpaceShip(Person(:JULIA, 2009), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0])\n\njulia> s = @set s.velocity[1] += 999999\nSpaceShip(Person(:JULIA, 2009), [999999.0, 0.0, 0.0], [0.0, 0.0, 0.0])\n\njulia> s = @set s.velocity[1] += 1000001\nSpaceShip(Person(:JULIA, 2009), [2.0e6, 0.0, 0.0], [0.0, 0.0, 0.0])\n\njulia> @set s.position[2] = 20\nSpaceShip(Person(:JULIA, 2009), [2.0e6, 0.0, 0.0], [0.0, 20.0, 0.0])","category":"page"},{"location":"intro/#Under-the-hood-1","page":"Introduction","title":"Under the hood","text":"","category":"section"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"Under the hood this package implements a simple lens api. This api may be useful in its own right and works as follows:","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"julia> using Setfield\n\njulia> l = @lens _.a.b\n(@lens _.a.b)\n\njulia> struct AB;a;b;end\n\njulia> obj = AB(AB(1,2),3)\nAB(AB(1, 2), 3)\n\njulia> set(obj, l, 42)\nAB(AB(1, 42), 3)\n\njulia> obj\nAB(AB(1, 2), 3)\n\njulia> get(obj, l)\n2\n\njulia> modify(x->10x, obj, l)\nAB(AB(1, 20), 3)","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"Now the @set macro simply provides sugar for creating a lens and applying it. For instance","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"@set obj.a.b = 42","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"expands roughly to","category":"page"},{"location":"intro/#","page":"Introduction","title":"Introduction","text":"l = @lens _.a.b\nset(obj, l, 42)","category":"page"},{"location":"#Docstrings-1","page":"Docstrings","title":"Docstrings","text":"","category":"section"},{"location":"#","page":"Docstrings","title":"Docstrings","text":"Modules = [Setfield]","category":"page"},{"location":"#Setfield.Lens","page":"Docstrings","title":"Setfield.Lens","text":"Lens\n\nA Lens allows to access or replace deeply nested parts of complicated objects.\n\nExample\n\njulia> using Setfield\n\njulia> struct T;a;b; end\n\njulia> obj = T(\"AA\", \"BB\")\nT(\"AA\", \"BB\")\n\njulia> lens = @lens _.a\n(@lens _.a)\n\njulia> get(obj, lens)\n\"AA\"\n\njulia> set(obj, lens, 2)\nT(2, \"BB\")\n\njulia> obj\nT(\"AA\", \"BB\")\n\njulia> modify(lowercase, obj, lens)\nT(\"aa\", \"BB\")\n\nInterface\n\nConcrete subtypes of Lens have to implement\n\nset(obj, lens, val)\nget(obj, lens)\n\nThese must be pure functions, that satisfy the three lens laws:\n\n@assert get(set(obj, lens, val), lens) == val\n        # You get what you set.\n@assert set(obj, lens, get(obj, lens)) == obj\n        # Setting what was already there changes nothing.\n@assert set(set(obj, lens, val1), lens, val2) == set(obj, lens, val2)\n        # The last set wins.\n\nSee also @lens, set, get, modify.\n\n\n\n\n\n","category":"type"},{"location":"#Base.get","page":"Docstrings","title":"Base.get","text":"get(obj, l::Lens)\n\nAccess a deeply nested part of obj. See also Lens.\n\n\n\n\n\n","category":"function"},{"location":"#Setfield.modify","page":"Docstrings","title":"Setfield.modify","text":"modify(f, obj, l::Lens)\n\nReplace a deeply nested part x of obj by f(x). See also Lens.\n\n\n\n\n\n","category":"function"},{"location":"#Setfield.set","page":"Docstrings","title":"Setfield.set","text":"set(obj, l::Lens, val)\n\nReplace a deeply nested part of obj by val. See also Lens.\n\n\n\n\n\n","category":"function"},{"location":"#Setfield.@lens-Tuple{Any}","page":"Docstrings","title":"Setfield.@lens","text":"@lens\n\nConstruct a lens from a field access.\n\nExample\n\njulia> using Setfield\n\njulia> struct T;a;b;end\n\njulia> t = T(\"A1\", T(T(\"A3\", \"B3\"), \"B2\"))\nT(\"A1\", T(T(\"A3\", \"B3\"), \"B2\"))\n\njulia> l = @lens _.b.a.b\n(@lens _.b.a.b)\n\njulia> get(t, l)\n\"B3\"\n\njulia> set(t, l, 100)\nT(\"A1\", T(T(\"A3\", 100), \"B2\"))\n\njulia> t = (\"one\", \"two\")\n(\"one\", \"two\")\n\njulia> set(t, (@lens _[1]), \"1\")\n(\"1\", \"two\")\n\n\n\n\n\n","category":"macro"},{"location":"#Setfield.@set!-Tuple{Any}","page":"Docstrings","title":"Setfield.@set!","text":"@set! assignment\n\nShortcut for obj = @set obj....\n\njulia> t = (a=1,) (a = 1,)\n\njulia> @set! t.a=2 (a = 2,)\n\njulia> t (a = 2,)\n\n\n\n\n\n","category":"macro"},{"location":"#Setfield.@set-Tuple{Any}","page":"Docstrings","title":"Setfield.@set","text":"@set assignment\n\nReturn a modified copy of deeply nested objects.\n\nExample\n\njulia> using Setfield\n\njulia> struct T;a;b end\n\njulia> t = T(1,2)\nT(1, 2)\n\njulia> @set t.a = 5\nT(5, 2)\n\njulia> t\nT(1, 2)\n\njulia> t = @set t.a = T(2,2)\nT(T(2, 2), 2)\n\njulia> @set t.a.b = 3\nT(T(2, 3), 2)\n\n\n\n\n\n","category":"macro"},{"location":"#Setfield.ConstIndexLens","page":"Docstrings","title":"Setfield.ConstIndexLens","text":"ConstIndexLens{I}\n\nLens with index stored in type parameter.  This is useful for type-stable get and set operations on tuples and named tuples.\n\nThis lens can be constructed by, e.g., @lens _[$1].  Complex expression must be wrapped with $(...) like @lens _[$(length(xs))].\n\nExamples\n\njulia> using Setfield\n\njulia> get((1, 2.0), @lens _[$1])\n1\n\njulia> Base.promote_op(get, typeof.(((1, 2.0), @lens _[$1]))...)\nInt64\n\njulia> Base.promote_op(get, typeof.(((1, 2.0), @lens _[1]))...) !== Int\ntrue\n\n\n\n\n\n","category":"type"},{"location":"#Setfield.FunctionLens","page":"Docstrings","title":"Setfield.FunctionLens","text":"FunctionLens(f)\n@lens f(_)\n\nLens with get method definition that simply calls f. set method for each function f must be implemented manually. Use methods(set, (Any, Setfield.FunctionLens, Any)) to get a list of supported functions.\n\nNote that FunctionLens flips the order of composition; i.e., (@lens f(_)) ∘ (@lens g(_)) == @lens g(f(_)).\n\nExample\n\njulia> using Setfield\n\njulia> obj = ((1, 2), (3, 4));\n\njulia> lens = (@lens first(_)) ∘ (@lens last(_))\n(@lens last(first(_)))\n\njulia> get(obj, lens)\n2\n\njulia> set(obj, lens, '2')\n((1, '2'), (3, 4))\n\nImplementation\n\nTo use myfunction as a lens, define a set method with the following signature:\n\nSetfield.set(obj, ::typeof(@lens myfunction(_)), val) = ...\n\ntypeof is used above instead of FunctionLens because how actual type of @lens myfunction(_) is implemented is not the part of stable API.\n\n\n\n\n\n","category":"type"},{"location":"#Base.:∘-Tuple{Lens,Lens}","page":"Docstrings","title":"Base.:∘","text":"lens₁ ∘ lens₂\ncompose([lens₁, [lens₂, [lens₃, ...]]])\n\nCompose lenses lens₁, lens₂, ..., lensₙ to access nested objects.\n\nExample\n\njulia> using Setfield\n\njulia> obj = (a = (b = (c = 1,),),);\n\njulia> la = @lens _.a\n       lb = @lens _.b\n       lc = @lens _.c\n       lens = la ∘ lb ∘ lc\n(@lens _.a.b.c)\n\njulia> get(obj, lens)\n1\n\n\n\n\n\n","category":"method"},{"location":"#Setfield.lensmacro-Tuple{Any,Any}","page":"Docstrings","title":"Setfield.lensmacro","text":"lensmacro(lenstransform, ex::Expr)\n\nThis function can be used to create a customized variant of @lens. It works by applying lenstransform to the created lens at runtime.\n\nfunction mytransform(lens::Lens)::Lens\n    ...\nend\nmacro mylens(ex)\n    lensmacro(mytransform, ex)\nend\n\nSee also setmacro.\n\n\n\n\n\n","category":"method"},{"location":"#Setfield.setmacro-Tuple{Any,Expr}","page":"Docstrings","title":"Setfield.setmacro","text":"setmacro(lenstransform, ex::Expr; overwrite::Bool=false)\n\nThis function can be used to create a customized variant of @set. It works by applying lenstransform to the lens that is used in the customized @set macro at runtime.\n\nfunction mytransform(lens::Lens)::Lens\n    ...\nend\nmacro myset(ex)\n    setmacro(mytransform, ex)\nend\n\nSee also lensmacro.\n\n\n\n\n\n","category":"method"}]
}
