tsc
minify build/library.js > build/min/library.js
html-minifier --collapse-whitespace index.html -o build/min/index.html
cp pong.svg build/min/pong.svg
cd build/min
zip -r ../pong.zip *
cd ../..;
cp build/library.js library.js
cp build/library.js.map library.js.map