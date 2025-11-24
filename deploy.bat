git checkout --orphan pages
git --git-dir=.git --work-tree=dist add .
git --git-dir=.git --work-tree=dist commit -m "Deploy"
git push origin pages