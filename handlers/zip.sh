cd build
mkdir zip
cd webpack
for path in * ; do
    echo "$path"
    #jar -cfM index.zip -C webpack
    # echo "jar -cfM $path.zip -C $path ."
    jar -cfM ../zip/$path.zip -C $path .
done
# cmd /k